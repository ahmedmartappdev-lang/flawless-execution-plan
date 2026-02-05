import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { toast } from 'sonner';
import type { Address } from './useAddresses';

interface OrderInput {
  address: Address;
  paymentMethod: 'cash' | 'upi' | 'card';
  customerNotes?: string;
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

  const createOrder = useMutation({
    mutationFn: async ({ address, paymentMethod, customerNotes }: OrderInput) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (items.length === 0) throw new Error('Cart is empty');

      const subtotal = getTotalAmount();
      const deliveryFee = getDeliveryFee();
      const platformFee = 5;
      const totalAmount = subtotal + deliveryFee + platformFee;

      // Group items by vendor (for multi-vendor support in future)
      const vendorId = items[0].vendor_id;
      
      // Create order
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
          customer_notes: customerNotes,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item: CartItem) => ({
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

      return order;
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

      console.log('Cancelling order:', orderId); // Debug log

      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Cancelled by customer'
        })
        .eq('id', orderId)
        .eq('customer_id', user.id)
        .eq('status', 'pending') // Ensure strict status check
        .select()
        .maybeSingle(); // Changed from .single() to .maybeSingle() to handle no rows gracefully

      if (error) {
        console.error('Supabase cancel error:', error);
        throw error;
      }

      // If no data returned, it implies the condition (status=pending) failed
      if (!data) {
        throw new Error('Order cannot be cancelled. It might strictly not be in pending state.');
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
