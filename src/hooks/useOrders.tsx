import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useRealtimeInvalidation } from '@/hooks/useRealtimeInvalidation';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { toast } from 'sonner';
import { useDeliveryFeeConfig, computeDeliveryFee } from '@/hooks/useDeliveryFeeConfig';
import type { Address } from './useAddresses';

// ... (keep the OrderInput interface and generateOrderNumber function) ...
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
  const { items, getDeliveryFee, clearCart } = useCartStore();
  const queryClient = useQueryClient();
  const { data: feeConfig } = useDeliveryFeeConfig();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // FIX: Query the orders and deeply nest the order_items.
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('customer_id', user.id)
        .order('placed_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching orders:", error);
        throw error;
      }
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
      
      const activeItems = items.filter(item => !(item.stock_quantity !== undefined && item.stock_quantity <= 0));
      if (activeItems.length === 0) throw new Error('Cart has no available items to order.');

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

      const vendorGroups: Record<string, CartItem[]> = {};
      activeItems.forEach((item: CartItem) => {
        const vid = item.vendor_id || 'unassigned';
        if (!vendorGroups[vid]) vendorGroups[vid] = [];
        vendorGroups[vid].push(item);
      });

      const vendorIds = Object.keys(vendorGroups);
      const createdOrders: any[] = [];

      const globalSubtotal = activeItems.reduce((sum, i) => sum + i.selling_price * i.quantity, 0);
      const globalFees = feeConfig
        ? computeDeliveryFee(feeConfig, globalSubtotal)
        : { deliveryFee: getDeliveryFee(), platformFee: 5, smallOrderFee: 0 };

      let remainingCredit = creditUsed;

      for (let i = 0; i < vendorIds.length; i++) {
        const vendorId = vendorIds[i];
        const vendorItems = vendorGroups[vendorId];
        const subtotal = vendorItems.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);

        const orderDeliveryFee = i === 0 ? globalFees.deliveryFee : 0;
        const orderPlatformFee = i === 0 ? globalFees.platformFee : 0;
        const orderSmallOrderFee = i === 0 ? globalFees.smallOrderFee : 0;
        const gst = orderPlatformFee * 0.18; 
        
        const totalAmount = subtotal + orderDeliveryFee + orderPlatformFee + orderSmallOrderFee + gst;

        const orderCredit = Math.min(remainingCredit, totalAmount);
        remainingCredit -= orderCredit;

        const orderNumber = generateOrderNumber();
        const actualVendorId = vendorId === 'unassigned' ? null : vendorId;

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            customer_id: user.id,
            vendor_id: actualVendorId,
            delivery_address: {
              address_type: address.address_type,
              address_line1: address.address_line1,
              address_line2: address.address_line2,
              landmark: address.landmark,
              city: address.city,
              state: address.state,
              pincode: address.pincode,
            },
            delivery_latitude: address.latitude || null,
            delivery_longitude: address.longitude || null,
            subtotal,
            delivery_fee: orderDeliveryFee,
            platform_fee: orderPlatformFee,
            total_amount: totalAmount,
            payment_method: paymentMethod,
            payment_status: paymentMethod === 'credit' && orderCredit >= totalAmount ? 'paid' : 'pending',
            credit_used: orderCredit > 0 ? orderCredit : null,
            customer_notes: customerNotes,
            status: 'pending',
          })
          .select()
          .single();

        if (orderError) throw orderError;

        const orderItems = vendorItems.map((item: CartItem) => ({
          order_id: order.id,
          product_id: item.product_id,
          product_snapshot: {
            id: item.product_id,
            name: item.name,
            image_url: item.image_url, // IMPORTANT: Ensure image_url is mapped correctly here
            unit_value: item.unit_value,
            unit_type: item.unit_type,
            selling_price: item.selling_price,
            mrp: item.mrp,
          },
          quantity: item.quantity,
          unit_price: item.selling_price,
          mrp: item.mrp || item.selling_price,
          discount_amount: Math.max(0, (item.mrp || item.selling_price) - item.selling_price) * item.quantity,
          total_price: item.selling_price * item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        createdOrders.push(order);
      }

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

      if (createdOrders.length === 1) return createdOrders[0];
      return { ...createdOrders[0], order_number: createdOrders.map(o => o.order_number).join(', ') };
    },
    onSuccess: (order) => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
      toast.success('Order placed successfully!');
      return order;
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to place order. Please try again.');
      console.error('Create order error:', error);
    },
  });

  const cancelOrder = useMutation({
    mutationFn: async (orderId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Cancelled by customer'
        })
        .eq('id', orderId)
        .eq('customer_id', user.id)
        .in('status', ['pending', 'confirmed']) 
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Order cannot be cancelled. It may be in preparation or already shipped.');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
      toast.success('Order cancelled successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel order.');
    },
  });

  return { orders, isLoading, createOrder, cancelOrder };
}
