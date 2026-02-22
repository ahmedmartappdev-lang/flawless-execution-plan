import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, MoreVertical, UserPlus, Package, MapPin, Plus } from 'lucide-react';
import AdminCreateOrder from '@/components/admin/AdminCreateOrder';
import { DashboardLayout, adminNavItems } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
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
  };
}

const AdminOrders: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [assignDialogOrder, setAssignDialogOrder] = useState<any | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(*),
          delivery_partners:delivery_partner_id(id, full_name, phone)
        `)
        .order('placed_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      const { data } = await query.limit(50);
      return data || [];
    },
  });

  const { data: availablePartners } = useQuery({
    queryKey: ['available-delivery-partners'],
    queryFn: async () => {
      const { data } = await supabase
        .from('delivery_partners')
        .select('id, full_name, phone, status')
        .in('status', ['available', 'offline']);
      return data || [];
    },
  });

  const assignPartnerMutation = useMutation({
    mutationFn: async ({ orderId, partnerId }: { orderId: string; partnerId: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ 
          delivery_partner_id: partnerId,
          status: 'assigned_to_delivery' as any
        })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({ title: 'Delivery partner assigned successfully' });
      setAssignDialogOrder(null);
      setSelectedPartnerId('');
    },
    onError: () => {
      toast({ title: 'Failed to assign delivery partner', variant: 'destructive' });
    },
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
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
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
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredOrders = orders?.filter(order =>
    order.order_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout
      title="Orders Management"
      navItems={adminNavItems}
      roleColor="bg-red-500 text-white"
      roleName="Admin Panel"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CardTitle>All Orders</CardTitle>
              <Button size="sm" onClick={() => setCreateOrderOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Create Order
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                  <SelectItem value="assigned_to_delivery">Assigned</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredOrders?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Delivery Partner</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders?.map((order) => {
                    const deliveryPartner = order.delivery_partners as {
                      id: string;
                      full_name?: string;
                      phone?: string;
                    } | null;

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>
                          {format(new Date(order.placed_at), 'dd MMM, hh:mm a')}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)} variant="secondary">
                            {order.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {deliveryPartner?.full_name ? (
                            <span className="text-sm">{deliveryPartner.full_name}</span>
                          ) : order.status === 'ready_for_pickup' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAssignDialogOrder(order)}
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              Assign
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.payment_status === 'completed' ? 'default' : 'outline'}>
                            {order.payment_status}
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
                              {!deliveryPartner && ['ready_for_pickup', 'confirmed', 'preparing'].includes(order.status) && (
                                <DropdownMenuItem onClick={() => setAssignDialogOrder(order)}>
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Assign Delivery Partner
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
                  {((selectedOrder.order_items || []) as unknown as OrderItem[]).map((item) => (
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
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>₹{Number(selectedOrder.total_amount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Delivery Partner Dialog */}
      <Dialog open={!!assignDialogOrder} onOpenChange={() => setAssignDialogOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Delivery Partner</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Select a delivery partner for order {assignDialogOrder?.order_number}
            </p>
            <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a delivery partner" />
              </SelectTrigger>
              <SelectContent>
                {availablePartners?.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.full_name || 'Unknown'} ({partner.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOrder(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (assignDialogOrder && selectedPartnerId) {
                  assignPartnerMutation.mutate({
                    orderId: assignDialogOrder.id,
                    partnerId: selectedPartnerId,
                  });
                }
              }}
              disabled={!selectedPartnerId || assignPartnerMutation.isPending}
            >
              {assignPartnerMutation.isPending ? 'Assigning...' : 'Assign Partner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Order Dialog */}
      <AdminCreateOrder open={createOrderOpen} onOpenChange={setCreateOrderOpen} />
    </DashboardLayout>
  );
};

export default AdminOrders;
