import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Phone, CheckCircle, Truck, Package, Navigation } from 'lucide-react';
import { DashboardLayout, deliveryNavItems } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

const DeliveryActive: React.FC = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [otpDialogOrder, setOtpDialogOrder] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');

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
        .select(`
          *,
          order_items:order_items(*)
        `)
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

  const verifyOtpAndDeliver = useMutation({
    mutationFn: async ({ orderId, otp }: { orderId: string; otp: string }) => {
      // Fetch the order to verify OTP
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('delivery_otp')
        .eq('id', orderId)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (order.delivery_otp !== otp) {
        throw new Error('Invalid OTP');
      }

      // Update order status to delivered
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'delivered' as any,
          payment_status: 'completed' as any
        })
        .eq('id', orderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-active-orders-full'] });
      toast({ title: 'Order delivered successfully!' });
      setOtpDialogOrder(null);
      setOtpInput('');
    },
    onError: (error) => {
      toast({ 
        title: error.message === 'Invalid OTP' ? 'Invalid OTP' : 'Failed to deliver order', 
        description: error.message === 'Invalid OTP' ? 'Please check the OTP and try again' : undefined,
        variant: 'destructive' 
      });
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
    };
    return flow[currentStatus];
  };

  const getNextStatusLabel = (currentStatus: string) => {
    const labels: Record<string, string> = {
      assigned_to_delivery: 'Mark as Picked Up',
      picked_up: 'Start Delivery',
      out_for_delivery: 'Complete Delivery',
    };
    return labels[currentStatus] || 'Update';
  };

  const handleStatusUpdate = (orderId: string, currentStatus: string) => {
    if (currentStatus === 'out_for_delivery') {
      // Need OTP verification
      setOtpDialogOrder(orderId);
    } else {
      const nextStatus = getNextStatus(currentStatus);
      if (nextStatus) {
        updateStatusMutation.mutate({ orderId, status: nextStatus });
      }
    }
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
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.href = '/delivery/available'}
            >
              View Available Orders
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders?.map((order) => {
            const deliveryAddress = order.delivery_address as {
              address_line1?: string;
              address_line2?: string;
              city?: string;
              pincode?: string;
              landmark?: string;
            } | null;

            const orderItems = (order.order_items || []) as unknown as Array<{
              id: string;
              quantity: number;
              product_snapshot: { name: string };
            }>;

            return (
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
                  {/* Order Items Summary */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Order Items</span>
                    </div>
                    <div className="space-y-1">
                      {orderItems.slice(0, 3).map((item) => (
                        <p key={item.id} className="text-sm text-muted-foreground">
                          {item.quantity}x {(item.product_snapshot as any)?.name || 'Item'}
                        </p>
                      ))}
                      {orderItems.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{orderItems.length - 3} more items
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">DELIVER TO</p>
                      <p className="font-medium">
                        {deliveryAddress?.address_line1 || 'Address not available'}
                      </p>
                      {deliveryAddress?.address_line2 && (
                        <p className="text-sm text-muted-foreground">
                          {deliveryAddress.address_line2}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {deliveryAddress?.city} - {deliveryAddress?.pincode}
                      </p>
                      {deliveryAddress?.landmark && (
                        <p className="text-sm text-muted-foreground">
                          Near: {deliveryAddress.landmark}
                        </p>
                      )}
                    </div>
                    {order.delivery_latitude && order.delivery_longitude && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          window.open(
                            `https://www.google.com/maps/dir/?api=1&destination=${order.delivery_latitude},${order.delivery_longitude}`,
                            '_blank'
                          );
                        }}
                      >
                        <Navigation className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Customer Notes */}
                  {order.customer_notes && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">CUSTOMER NOTE</p>
                      <p className="text-sm">{order.customer_notes}</p>
                    </div>
                  )}

                  {/* Order Summary */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Order Amount</p>
                      <p className="text-xl font-bold">₹{Number(order.total_amount).toLocaleString()}</p>
                      <Badge variant="outline" className="mt-1 capitalize">{order.payment_method}</Badge>
                    </div>
                    <Button 
                      onClick={() => handleStatusUpdate(order.id, order.status)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {getNextStatusLabel(order.status)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* OTP Verification Dialog */}
      <Dialog open={!!otpDialogOrder} onOpenChange={() => setOtpDialogOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Delivery OTP</DialogTitle>
            <DialogDescription>
              Ask the customer for the 4-digit OTP to complete the delivery
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter 4-digit OTP"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="text-center text-2xl tracking-widest"
              maxLength={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOtpDialogOrder(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (otpDialogOrder && otpInput.length === 4) {
                  verifyOtpAndDeliver.mutate({ orderId: otpDialogOrder, otp: otpInput });
                }
              }}
              disabled={otpInput.length !== 4 || verifyOtpAndDeliver.isPending}
            >
              {verifyOtpAndDeliver.isPending ? 'Verifying...' : 'Confirm Delivery'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DeliveryActive;
