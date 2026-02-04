import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, MoreVertical, CheckCircle, XCircle, Clock, Package, MapPin, User } from 'lucide-react';
import { DashboardLayout, vendorNavItems } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_snapshot: {
    name: string;
    image_url?: string;
    unit_value?: number;
    unit_type?: string;
  };
}

const VendorOrders: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendor } = useQuery({
    queryKey: ['vendor-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['vendor-orders', vendor?.id, statusFilter],
    queryFn: async () => {
      if (!vendor?.id) return [];
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(*)
        `)
        .eq('vendor_id', vendor.id)
        .order('placed_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      const { data } = await query.limit(50);
      return data || [];
    },
    enabled: !!vendor?.id,
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
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      toast({ title: 'Order status updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-indigo-100 text-indigo-800',
      ready_for_pickup: 'bg-purple-100 text-purple-800',
      assigned_to_delivery: 'bg-purple-100 text-purple-800',
      picked_up: 'bg-cyan-100 text-cyan-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout
      title="Orders"
      navItems={vendorNavItems}
      roleColor="bg-purple-500 text-white"
      roleName="Vendor Panel"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Your Orders</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready_for_pickup">Ready</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : orders?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders?.map((order) => {
                    const orderItems = (order.order_items || []) as unknown as OrderItem[];
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>
                          {format(new Date(order.placed_at), 'dd MMM, hh:mm a')}
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {orderItems.length} item{orderItems.length !== 1 ? 's' : ''}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)} variant="secondary">
                            {order.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{Number(order.total_amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {order.status === 'pending' && (
                                <DropdownMenuItem
                                  onClick={() => updateStatusMutation.mutate({ 
                                    orderId: order.id, 
                                    status: 'confirmed' 
                                  })}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Confirm Order
                                </DropdownMenuItem>
                              )}
                              {order.status === 'confirmed' && (
                                <DropdownMenuItem
                                  onClick={() => updateStatusMutation.mutate({ 
                                    orderId: order.id, 
                                    status: 'preparing' 
                                  })}
                                >
                                  <Clock className="w-4 h-4 mr-2" />
                                  Start Preparing
                                </DropdownMenuItem>
                              )}
                              {order.status === 'preparing' && (
                                <DropdownMenuItem
                                  onClick={() => updateStatusMutation.mutate({ 
                                    orderId: order.id, 
                                    status: 'ready_for_pickup' 
                                  })}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Ready for Pickup
                                </DropdownMenuItem>
                              )}
                              {order.status === 'pending' && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => updateStatusMutation.mutate({ 
                                    orderId: order.id, 
                                    status: 'cancelled' 
                                  })}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancel Order
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Status & Date */}
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(selectedOrder.status)} variant="secondary">
                  {selectedOrder.status.replace(/_/g, ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selectedOrder.placed_at), 'dd MMM yyyy, hh:mm a')}
                </span>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Order Items
                </h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  {((selectedOrder.order_items || []) as OrderItem[]).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.product_snapshot?.image_url && (
                        <img
                          src={item.product_snapshot.image_url}
                          alt={item.product_snapshot.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product_snapshot?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} × ₹{item.unit_price}
                          {item.product_snapshot?.unit_value && item.product_snapshot?.unit_type && (
                            <span className="ml-1">
                              ({item.product_snapshot.unit_value}{item.product_snapshot.unit_type})
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="font-medium">₹{item.total_price}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Delivery Address
                </h4>
                <div className="bg-muted/50 rounded-lg p-4">
                  {(() => {
                    const addr = selectedOrder.delivery_address as {
                      address_type?: string;
                      address_line1?: string;
                      address_line2?: string;
                      landmark?: string;
                      city?: string;
                      state?: string;
                      pincode?: string;
                    } | null;
                    return (
                      <>
                        <Badge variant="outline" className="mb-2 capitalize">
                          {addr?.address_type || 'Home'}
                        </Badge>
                        <p className="font-medium">{addr?.address_line1}</p>
                        {addr?.address_line2 && <p>{addr.address_line2}</p>}
                        {addr?.landmark && <p className="text-muted-foreground">Near: {addr.landmark}</p>}
                        <p className="text-muted-foreground">
                          {addr?.city}, {addr?.state} - {addr?.pincode}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Customer Notes */}
              {selectedOrder.customer_notes && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Customer Notes
                  </h4>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <p>{selectedOrder.customer_notes}</p>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{Number(selectedOrder.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>₹{Number(selectedOrder.delivery_fee).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform Fee</span>
                  <span>₹{Number(selectedOrder.platform_fee).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>₹{Number(selectedOrder.total_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Method</span>
                  <Badge variant="outline" className="capitalize">{selectedOrder.payment_method}</Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default VendorOrders;
