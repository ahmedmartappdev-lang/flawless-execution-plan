import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Package, Clock, HandCoins } from 'lucide-react';
import { DashboardLayout, deliveryNavItems } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

const DeliveryAvailable: React.FC = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: partner } = useQuery({
    queryKey: ['delivery-partner-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('delivery_partners')
        .select('id')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch orders that are ready for pickup and have no delivery partner assigned
  const { data: availableOrders, isLoading } = useQuery({
    queryKey: ['delivery-available-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          vendors:vendor_id(business_name, store_address, phone)
        `)
        .eq('status', 'ready_for_pickup')
        .is('delivery_partner_id', null)
        .order('placed_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      if (!partner?.id) throw new Error('Delivery partner not found');
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          delivery_partner_id: partner.id,
          status: 'assigned_to_delivery' as any
        })
        .eq('id', orderId)
        .is('delivery_partner_id', null);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-available-orders'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-active-orders-full'] });
      toast({ title: 'Order accepted! Head to the vendor location.' });
    },
    onError: (error) => {
      toast({ 
        title: 'Could not accept order', 
        description: 'It may have been assigned to another partner.',
        variant: 'destructive' 
      });
      queryClient.invalidateQueries({ queryKey: ['delivery-available-orders'] });
    },
  });

  return (
    <DashboardLayout
      title="Available Orders"
      navItems={deliveryNavItems}
      roleColor="bg-blue-500 text-white"
      roleName="Delivery Partner"
    >
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : availableOrders?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No orders available for pickup right now</p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back soon for new delivery opportunities
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {availableOrders?.map((order) => {
            const vendor = order.vendors as { 
              business_name?: string; 
              store_address?: string; 
              phone?: string;
            } | null;
            const deliveryAddress = order.delivery_address as {
              address_line1?: string;
              city?: string;
              landmark?: string;
            } | null;

            return (
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{order.order_number}</CardTitle>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      Ready for Pickup
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pickup Location */}
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">PICKUP FROM</p>
                      <p className="font-medium">{vendor?.business_name || 'Vendor'}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {vendor?.store_address || 'Address not available'}
                      </p>
                    </div>
                  </div>

                  {/* Drop Location */}
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">DELIVER TO</p>
                      <p className="font-medium">
                        {deliveryAddress?.address_line1 || 'Customer Address'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {deliveryAddress?.city}
                        {deliveryAddress?.landmark && ` • Near ${deliveryAddress.landmark}`}
                      </p>
                    </div>
                  </div>

                  {/* Order Info */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <HandCoins className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">₹{Number(order.total_amount).toLocaleString()}</span>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {order.payment_method}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(order.placed_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Accept Button */}
                  <Button 
                    className="w-full" 
                    onClick={() => acceptOrderMutation.mutate(order.id)}
                    disabled={acceptOrderMutation.isPending}
                  >
                    {acceptOrderMutation.isPending ? 'Accepting...' : 'Accept Order'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DeliveryAvailable;
