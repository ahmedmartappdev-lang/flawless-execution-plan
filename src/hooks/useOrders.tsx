import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useRealtimeInvalidation } from '@/hooks/useRealtimeInvalidation';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { toast } from 'sonner';
import { useDeliveryFeeConfig, computeDeliveryFee } from '@/hooks/useDeliveryFeeConfig';
import type { Address } from './useAddresses';

interface OrderInput {
  address: Address;
  paymentMethod: 'cash' | 'upi' | 'credit';
  customerNotes?: string;
  creditUsed?: number;
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AM${timestamp}${random}`;
}

export function useOrders() {
  const { user } = useAuthStore();
  const { items, getTotalAmount, getDeliveryFee, clearCart } = useCartStore();
  const queryClient = useQueryClient();
  const { data: feeConfig } = useDeliveryFeeConfig();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(*)
        `)
        .eq('customer_id', user.id)
        .order('placed_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useRealtimeInvalidation({
    table: 'orders',
    filter: `customer_id=eq.${user?.id}`,
    queryKeys: [['orders', user?.id || '']],
    enabled: !!user?.id,
  });

  const createOrder = useMutation({
    mutationFn: async ({ address, paymentMethod, customerNotes, creditUsed = 0 }: OrderInput) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (items.length === 0) throw new Error('Cart is empty');

      // Validate credit balance before proceeding
      if (creditUsed > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credit_balance')
          .eq('user_id', user.id)
          .single();
        const currentBalance = Number(profile?.credit_balance || 0);
        if (creditUsed > currentBalance) {
          throw new Error(`Insufficient credit balance. Available: ₹${currentBalance.toFixed(2)}`);
        }
      }

      // Group items by vendor for multi-vendor support
      const vendorGroups: Record<string, CartItem[]> = {};
      items.forEach((item: CartItem) => {
        const vid = item.vendor_id;
        if (!vendorGroups[vid]) vendorGroups[vid] = [];
        vendorGroups[vid].push(item);
      });

      const vendorIds = Object.keys(vendorGroups);
      const createdOrders: any[] = [];

      // Distribute credit across orders if used
      let remainingCredit = creditUsed;

      for (const vendorId of vendorIds) {
        const vendorItems = vendorGroups[vendorId];
        const subtotal = vendorItems.reduce((sum, i) => sum + i.selling_price * i.quantity, 0);

        // Calculate delivery fee using dynamic config
        const fees = feeConfig
          ? computeDeliveryFee(feeConfig, subtotal)
          : { deliveryFee: getDeliveryFee(), platformFee: 5, smallOrderFee: 0 };
        const deliveryFee = fees.deliveryFee;
        const platformFee = fees.platformFee;
        const smallOrderFee = fees.smallOrderFee;
        const totalAmount = subtotal + deliveryFee + platformFee + smallOrderFee;

        // Calculate credit for this order
        const orderCredit = Math.min(remainingCredit, totalAmount);
        remainingCredit -= orderCredit;

        const orderNumber = generateOrderNumber();

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            customer_id: user.id,
            vendor_id: vendorId,
            delivery_address: {
              address_type: address.address_type,
              address_line1: address.address_line1,
              address_line2: address.address_line2,
              landmark: address.landmark,
              city: address.city,
              state: address.state,
              pincode: address.pincode,
            },
            delivery_latitude: address.latitude,
            delivery_longitude: address.longitude,
            subtotal,
            delivery_fee: deliveryFee,
            platform_fee: platformFee,
            total_amount: totalAmount,
            payment_method: paymentMethod,
            payment_status: paymentMethod === 'cash' ? 'pending' : 'pending',
            credit_used: orderCredit > 0 ? orderCredit : null,
            customer_notes: customerNotes,
            status: 'pending',
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = vendorItems.map((item: CartItem) => ({
          order_id: order.id,
          product_id: item.product_id,
          product_snapshot: {
            id: item.product_id,
            name: item.name,
            image_url: item.image_url,
            unit_value: item.unit_value,
            unit_type: item.unit_type,
            selling_price: item.selling_price,
            mrp: item.mrp,
          },
          quantity: item.quantity,
          unit_price: item.selling_price,
          mrp: item.mrp,
          discount_amount: (item.mrp - item.selling_price) * item.quantity,
          total_price: item.selling_price * item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        createdOrders.push(order);
      }

      // Deduct credit if used
      if (creditUsed > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credit_balance')
          .eq('user_id', user.id)
          .single();

        const currentBalance = Number(profile?.credit_balance || 0);
        const newBalance = currentBalance - creditUsed;

        await supabase
          .from('profiles')
          .update({ credit_balance: newBalance })
          .eq('user_id', user.id);

        await (supabase.from('customer_credit_transactions') as any).insert({
          customer_id: user.id,
          amount: creditUsed,
          balance_after: newBalance,
          transaction_type: 'debit',
          description: `Used for order${createdOrders.length > 1 ? 's' : ''} #${createdOrders.map(o => o.order_number).join(', #')}`,
          order_id: createdOrders[0].id,
        });
      }

      // Return first order for single-vendor, or a combined result for multi-vendor
      if (createdOrders.length === 1) return createdOrders[0];
      return { ...createdOrders[0], order_number: createdOrders.map(o => o.order_number).join(', ') };
    },
    onSuccess: (order) => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
      toast.success('Order placed successfully!');
      return order;
    },
    onError: (error) => {
      toast.error('Failed to place order. Please try again.');
      console.error('Create order error:', error);
    },
  });

  // NEW: Cancel Order Mutation
  const cancelOrder = useMutation({
    mutationFn: async (orderId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('Cancelling order:', orderId);

      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Cancelled by customer'
        })
        .eq('id', orderId)
        .eq('customer_id', user.id)
        // Allow cancelling pending and confirmed orders
        .in('status', ['pending', 'confirmed']) 
        .select()
        .maybeSingle(); // Use maybeSingle to avoid 406 error if query matches 0 rows

      if (error) {
        console.error('Supabase cancel error:', error);
        throw error;
      }

      // If no data returned, it means the order wasn't found or RLS blocked it
      if (!data) {
        throw new Error('Order cannot be cancelled. It may be in preparation or already shipped.');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
      toast.success('Order cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel order.');
      console.error('Cancel order error:', error);
    },
  });

  return {
    orders,
    isLoading,
    createOrder,
    cancelOrder,
  };
}
