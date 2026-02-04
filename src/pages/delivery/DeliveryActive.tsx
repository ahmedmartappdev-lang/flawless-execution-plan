import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Phone, CheckCircle, Truck } from 'lucide-react';
import { DashboardLayout, deliveryNavItems } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

const DeliveryActive: React.FC = () => {
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

  const { data: orders, isLoading } = useQuery({
    queryKey: ['delivery-active-orders-full', partner?.id],
    queryFn: async () => {
      if (!partner?.id) return [];
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('delivery_partner_id', partner.id)
        .in('status', ['assigned_to_delivery', 'picked_up', 'out_for_delivery'])
        .order('placed_at', { ascending: false });
      return data || [];
    },
    enabled: !!partner?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status: status as any })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-active-orders-full'] });
      toast({ title: 'Order status updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      assigned_to_delivery: 'bg-purple-100 text-purple-800',
      picked_up: 'bg-yellow-100 text-yellow-800',
      out_for_delivery: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getNextStatus = (currentStatus: string) => {
    const flow: Record<string, string> = {
      assigned_to_delivery: 'picked_up',
      picked_up: 'out_for_delivery',
      out_for_delivery: 'delivered',
    };
    return flow[currentStatus];
  };

  const getNextStatusLabel = (currentStatus: string) => {
    const labels: Record<string, string> = {
      assigned_to_delivery: 'Mark as Picked Up',
      picked_up: 'Start Delivery',
      out_for_delivery: 'Mark as Delivered',
    };
    return labels[currentStatus] || 'Update';
  };

  return (
    <DashboardLayout
      title="Active Orders"
      navItems={deliveryNavItems}
      roleColor="bg-blue-500 text-white"
      roleName="Delivery Partner"
    >
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : orders?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No active orders assigned to you</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders?.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{order.order_number}</CardTitle>
                  <Badge className={getStatusColor(order.status)} variant="secondary">
                    {order.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Delivery Address</p>
                    <p className="text-sm text-muted-foreground">
                      {typeof order.delivery_address === 'object' 
                        ? `${(order.delivery_address as any)?.address_line1 || ''}, ${(order.delivery_address as any)?.city || ''}`
                        : 'Address not available'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Amount</p>
                    <p className="text-xl font-bold">₹{Number(order.total_amount).toLocaleString()}</p>
                    <Badge variant="outline" className="mt-1">{order.payment_method}</Badge>
                  </div>
                  <Button 
                    onClick={() => updateStatusMutation.mutate({
                      orderId: order.id,
                      status: getNextStatus(order.status)
                    })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {getNextStatusLabel(order.status)}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DeliveryActive;
