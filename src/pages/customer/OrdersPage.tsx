import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Clock, ChevronRight, MapPin, Phone, Key, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomNavigation } from '@/components/customer/BottomNavigation';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProductSnapshot {
  id: string;
  name: string;
  image_url?: string;
  unit_value?: number;
  unit_type?: string;
  selling_price: number;
  mrp: number;
}

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_snapshot: ProductSnapshot;
}

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { orders, isLoading, cancelOrder } = useOrders();
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      preparing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      ready_for_pickup: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      assigned_to_delivery: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      picked_up: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
      out_for_delivery: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleCancelOrder = async () => {
    if (orderToCancel) {
      await cancelOrder.mutateAsync(orderToCancel);
      setOrderToCancel(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">My Orders</h1>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Package className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Login to view orders</h2>
          <p className="text-muted-foreground text-center mb-6">
            Sign in to see your order history
          </p>
          <Button onClick={() => navigate('/auth')}>Login / Sign Up</Button>
        </div>

        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted pb-20">
      <header className="sticky top-0 z-40 bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">My Orders</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-6 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mb-4 border border-border">
              <Clock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground text-center mb-6">
              Your order history will appear here
            </p>
            <Button onClick={() => navigate('/')}>Start Shopping</Button>
          </div>
        ) : (
          orders.map((order) => {
            const orderItems = (order.order_items || []) as unknown as OrderItem[];
            const deliveryAddress = order.delivery_address as { 
              address_line1?: string;
              city?: string;
              pincode?: string;
            } | null;
            
            return (
              <Card key={order.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-lg">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.placed_at), 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)} variant="secondary">
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>

                  {/* OTP Display for Out for Delivery */}
                  {order.status === 'out_for_delivery' && order.delivery_otp && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Key className="w-5 h-5 text-primary" />
                        <span className="font-medium text-primary">Delivery OTP</span>
                      </div>
                      <p className="text-3xl font-bold tracking-widest text-primary">
                        {order.delivery_otp}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Share this OTP with your delivery partner
                      </p>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    {orderItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        {item.product_snapshot?.image_url && (
                          <img
                            src={item.product_snapshot.image_url}
                            alt={item.product_snapshot.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.product_snapshot?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} × ₹{item.unit_price}
                          </p>
                        </div>
                        <p className="font-medium text-sm">₹{item.total_price}</p>
                      </div>
                    ))}
                    {orderItems.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        +{orderItems.length - 3} more items
                      </p>
                    )}
                  </div>

                  {/* Delivery Address */}
                  {deliveryAddress && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="line-clamp-2">
                        {deliveryAddress.address_line1}, {deliveryAddress.city} - {deliveryAddress.pincode}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="pt-2 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-lg font-bold">₹{Number(order.total_amount).toLocaleString()}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {order.payment_method}
                      </Badge>
                    </div>

                    {/* Cancel Action */}
                    {order.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 mt-2"
                        onClick={() => setOrderToCancel(order.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel Order
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </main>

      <AlertDialog open={!!orderToCancel} onOpenChange={(open) => !open && setOrderToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently cancel your order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={handleCancelOrder}
            >
              Yes, Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />
    </div>
  );
};

export default OrdersPage;
