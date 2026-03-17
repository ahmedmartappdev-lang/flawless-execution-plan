import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { useOrders } from '@/hooks/useOrders';
import { useCustomerCredits } from '@/hooks/useCustomerCredits';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  
  // Backend Hooks
  const { orders, isLoading: isOrdersLoading, cancelOrder } = useOrders();
  const { creditBalance, creditLimit, dueAmount, availableCredit, creditHistory } = useCustomerCredits();
  const addItem = useCartStore((state) => state.addItem);

  // Credit card model: limit, due, available
  const isDue = dueAmount > 0;
  // Calculate total credits received and total debits from history
  const totalCredits = creditHistory.filter((t: any) => t.transaction_type === 'credit' || t.transaction_type === 'refund').reduce((s: number, t: any) => s + Number(t.amount), 0);
  const totalDebits = creditHistory.filter((t: any) => t.transaction_type === 'debit' || t.transaction_type === 'penalty').reduce((s: number, t: any) => s + Number(t.amount), 0);

  // Filter Logic
  const filteredOrders = orders?.filter(order => {
    if (activeFilter === 'Active') return ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'assigned_to_delivery', 'picked_up', 'out_for_delivery'].includes(order.status);
    if (activeFilter === 'Delivered') return order.status === 'delivered';
    if (activeFilter === 'Cancelled') return order.status === 'cancelled';
    if (activeFilter === 'On Credit') return order.payment_method === 'credit';
    return true;
  }) || [];

  const activeOrders = filteredOrders.filter(o => !['delivered', 'cancelled', 'refunded'].includes(o.status));
  const pastOrders = filteredOrders.filter(o => ['delivered', 'cancelled', 'refunded'].includes(o.status));

  // Reorder Function
  const handleReorder = (order: any) => {
    if (!order.order_items || order.order_items.length === 0) return;
    
    order.order_items.forEach((item: any) => {
      // Use product_snapshot if available (since the relation might not be queried)
      const p = item.product || item.product_snapshot;
      if (p) {
        addItem({ ...p, quantity: item.quantity, product_id: p.id });
      }
    });
    
    toast({
      title: "Items Added",
      description: "Previous order items have been added to your cart.",
      duration: 2500,
    });
    navigate('/cart');
  };

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'pending': return { label: 'Order Placed', color: 'text-secondary', progress: 'w-1/4' };
      case 'confirmed': return { label: 'Confirmed', color: 'text-secondary', progress: 'w-1/3' };
      case 'preparing': return { label: 'Preparing', color: 'text-secondary', progress: 'w-1/2' };
      case 'ready_for_pickup': return { label: 'Ready', color: 'text-primary', progress: 'w-2/3' };
      case 'assigned_to_delivery': return { label: 'Assigned', color: 'text-primary', progress: 'w-2/3' };
      case 'picked_up': return { label: 'Picked Up', color: 'text-primary', progress: 'w-3/4' };
      case 'out_for_delivery': return { label: 'On The Way', color: 'text-primary', progress: 'w-5/6' };
      case 'delivered': return { label: 'Delivered', color: 'text-green-800 bg-green-100' };
      case 'cancelled': return { label: 'Cancelled', color: 'text-muted bg-gray-100' };
      default: return { label: status, color: 'text-muted bg-gray-100', progress: 'w-0' };
    }
  };

  return (
    <CustomerLayout>
      <div className="bg-surface min-h-screen pb-24 font-sans text-content">
        
        {/* Mobile Page Header (Hidden on md/lg since CustomerLayout handles it) */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between shadow-sm md:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}>
              <svg className="h-6 w-6 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
            </button>
            <h1 className="text-[17px] font-bold text-dark">My Orders</h1>
          </div>
          <button className="p-1" onClick={() => navigate('/search')}>
            <svg className="h-6 w-6 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </button>
        </header>

        {/* FilterTabs */}
        <nav className="sticky top-[60px] md:top-0 z-40 bg-white py-3 border-b border-gray-100 overflow-x-auto no-scrollbar">
          <div className="flex px-4 gap-2 min-w-max">
            {['All', 'Active', 'Delivered', 'Cancelled', 'On Credit'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === tab ? 'bg-primary text-white' : 'bg-gray-100 text-muted'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </nav>

        <main className="p-4 space-y-6 max-w-3xl mx-auto">
          
          {isOrdersLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-48 w-full rounded-card" />)}
            </div>
          ) : (
            <>
              {/* Active Orders Section */}
              {activeOrders.length > 0 && (
                <section>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted mb-3 px-1">Active Order</h2>
                  {activeOrders.map(order => {
                    const statusInfo = getStatusDisplay(order.status);
                    return (
                      <div key={order.id} className="bg-white rounded-card border-2 border-primary shadow-glow p-4 mb-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-xs font-semibold text-muted uppercase">Order #{order.order_number?.slice(0,8) || order.id.slice(0,8)}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="inline-block w-2 h-2 rounded-full bg-secondary pulse-dot"></span>
                              <span className="text-sm font-bold text-secondary uppercase">{statusInfo.label}</span>
                            </div>
                          </div>
                          <span className="text-xs text-muted">Placed {format(new Date(order.placed_at || order.created_at), 'p')}</span>
                        </div>

                        {/* Progress Tracker */}
                        <div className="relative flex justify-between items-center mb-6 px-2">
                          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 -z-0"></div>
                          <div className={`absolute top-1/2 left-0 ${statusInfo.progress} h-0.5 bg-primary -translate-y-1/2 -z-0 transition-all duration-500`}></div>
                          
                          <div className="z-10 bg-primary text-white rounded-full p-1 border-2 border-white">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          </div>
                          <div className={`z-10 ${['preparing', 'ready_for_pickup', 'assigned_to_delivery', 'picked_up', 'out_for_delivery'].includes(order.status) ? 'bg-primary text-white ring-4 ring-primary/10' : 'bg-gray-100 text-gray-300'} rounded-full p-1 border-2 border-white`}>
                            {['preparing', 'ready_for_pickup', 'assigned_to_delivery', 'picked_up', 'out_for_delivery'].includes(order.status) ? (
                              <svg className="h-3 w-3 pulse-dot" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle></svg>
                            ) : <div className="h-3 w-3"></div>}
                          </div>
                          <div className={`z-10 ${order.status === 'out_for_delivery' ? 'bg-primary text-white ring-4 ring-primary/10' : 'bg-gray-100 text-gray-300'} rounded-full p-1 border-2 border-white`}>
                            {order.status === 'out_for_delivery' ? (
                               <svg className="h-3 w-3 pulse-dot" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle></svg>
                            ) : <div className="h-3 w-3"></div>}
                          </div>
                          <div className="z-10 bg-gray-100 text-gray-300 rounded-full p-1 border-2 border-white">
                            <div className="h-3 w-3"></div>
                          </div>
                        </div>
                        
                        <p className="text-center font-bold text-dark text-base mb-4">
                          {order.status === 'pending' ? 'Waiting for confirmation' : 
                           order.status === 'preparing' ? 'Your order is being prepared' : 
                           order.status === 'out_for_delivery' ? 'Driver is on the way' :
                           'Order is being processed'}
                        </p>

                        {/* Order Items Scroll */}
                        <div className="flex gap-3 overflow-x-auto no-scrollbar mb-4">
                          {order.order_items?.slice(0, 4).map((item: any) => {
                            // Fetch image correctly from nested relations or fallback to snapshot
                            const imgUrl = item.product?.primary_image_url || item.product_snapshot?.image_url || "/placeholder.svg";
                            return (
                              <img key={item.id} alt={item.product_snapshot?.name || 'Item'} className="w-14 h-14 rounded-lg flex-shrink-0 bg-white border border-gray-100 object-contain p-1" src={imgUrl} />
                            );
                          })}
                          {order.order_items?.length > 4 && (
                            <div className="w-14 h-14 rounded-lg flex-shrink-0 bg-surface flex items-center justify-center text-xs font-bold text-primary">
                              +{order.order_items.length - 4}
                            </div>
                          )}
                        </div>

                        {/* Action Links */}
                        <div className="flex justify-between items-center border-t border-gray-100 pt-4 px-1">
                          <button onClick={() => { setSelectedOrder(order); setDrawerOpen(true); }} className="text-primary font-bold text-sm">View Full Order</button>
                          {order.status === 'pending' && (
                            <button 
                              onClick={() => { setOrderToCancel(order.id); setCancelDialogOpen(true); }}
                              className="text-red-600 font-medium text-sm"
                            >
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </section>
              )}

              {/* Credit Summary */}
              {(creditHistory.length > 0 || activeFilter === 'On Credit') && (
                <section>
                  <div className="bg-gradient-to-br from-dark to-primary rounded-card p-5 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-lg font-bold">Ahmed Mart Credit</h3>
                          <p className="text-[10px] opacity-70 tracking-widest uppercase">
                            {isDue ? 'Due Amount' : 'Credit Balance'}
                          </p>
                        </div>
                        <div className={`${isDue ? 'bg-red-400/30' : 'bg-white/20'} px-2 py-1 rounded text-[10px] font-bold`}>
                          {isDue ? 'DUE' : 'CREDIT'}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div>
                          <p className="text-[10px] opacity-70 uppercase mb-0.5">Total Credited</p>
                          <p className="text-base font-bold">₹{totalCredits.toFixed(0)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] opacity-70 uppercase mb-0.5">Total Used</p>
                          <p className="text-base font-bold">₹{totalDebits.toFixed(0)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] opacity-70 uppercase mb-0.5">{isDue ? 'Due' : 'Balance'}</p>
                          <p className={`text-base font-bold ${isDue ? 'text-red-300' : 'text-green-300'}`}>
                            {isDue ? `-₹${dueAmount.toFixed(0)}` : `₹${creditBalance.toFixed(0)}`}
                          </p>
                        </div>
                      </div>

                      {totalCredits > 0 && (
                        <div className="w-full bg-white/20 h-1.5 rounded-full mb-4">
                          <div className="bg-white h-1.5 rounded-full transition-all" style={{ width: `${Math.min((totalDebits / totalCredits) * 100, 100)}%` }}></div>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <p className="text-[10px] opacity-80">{creditHistory.length} transaction{creditHistory.length !== 1 ? 's' : ''}</p>
                        <button 
                          onClick={() => {
                            const doc = new jsPDF();
                            doc.setFontSize(18);
                            doc.text('Ahmed Mart - Credit Statement', 14, 22);
                            doc.setFontSize(10);
                            doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, h:mm a')}`, 14, 30);
                            doc.text(`Current Balance: ${isDue ? `-₹${dueAmount.toFixed(2)}` : `₹${creditBalance.toFixed(2)}`}`, 14, 36);
                            
                            autoTable(doc, {
                              startY: 44,
                              head: [['Date', 'Type', 'Description', 'Amount', 'Balance After']],
                              body: creditHistory.map((t: any) => [
                                format(new Date(t.created_at), 'dd/MM/yyyy'),
                                t.transaction_type.toUpperCase(),
                                t.description || '-',
                                `${t.transaction_type === 'debit' || t.transaction_type === 'penalty' ? '-' : '+'}₹${Number(t.amount).toFixed(2)}`,
                                `₹${Number(t.balance_after).toFixed(2)}`,
                              ]),
                              styles: { fontSize: 8 },
                              headStyles: { fillColor: [34, 80, 60] },
                            });
                            
                            doc.save(`ahmed-mart-statement-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
                          }}
                          className="bg-white text-primary px-4 py-1.5 rounded-full text-xs font-bold shadow-sm"
                        >
                          View Statement
                        </button>
                      </div>
                    </div>
                    <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full"></div>
                  </div>
                </section>
              )}

              {/* Past Orders Section */}
              {pastOrders.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted mb-3 px-1">Past Orders</h2>
                  
                  {pastOrders.map(order => {
                    const statusInfo = getStatusDisplay(order.status);
                    return (
                      <div key={order.id} className={`bg-white rounded-card p-4 shadow-sm border border-gray-100 ${order.status === 'cancelled' ? 'opacity-80' : ''}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-dark uppercase">#{order.order_number?.slice(0,8) || order.id.slice(0,8)}</span>
                              <span className={`${statusInfo.color} text-[10px] px-2 py-0.5 rounded font-bold uppercase`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <p className="text-xs text-muted mt-0.5">{format(new Date(order.placed_at || order.created_at), 'do MMMM yyyy')}</p>
                          </div>
                          <p className="text-sm font-bold text-dark">₹{order.total_amount}</p>
                        </div>
                        
                        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                          {order.order_items?.slice(0, 4).map((item: any) => {
                             const imgUrl = item.product?.primary_image_url || item.product_snapshot?.image_url || "/placeholder.svg";
                             return (
                              <img key={item.id} alt={item.product_snapshot?.name || 'Item'} className={`w-10 h-10 rounded border border-gray-50 object-contain p-0.5 ${order.status === 'cancelled' ? 'grayscale' : ''}`} src={imgUrl} />
                            );
                          })}
                          {order.order_items?.length > 4 && (
                            <div className="w-10 h-10 rounded bg-gray-50 flex items-center justify-center text-[10px] text-muted">+{order.order_items.length - 4}</div>
                          )}
                        </div>

                        <div className={`grid ${order.status === 'cancelled' ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                          {order.status !== 'cancelled' && (
                            <button onClick={() => handleReorder(order)} className="py-2.5 px-4 border-2 border-primary text-primary rounded-xl text-sm font-bold hover:bg-primary/5 transition-colors">
                              Reorder
                            </button>
                          )}
                          <button onClick={() => { setSelectedOrder(order); setDrawerOpen(true); }} className={`py-2.5 px-4 ${order.status === 'cancelled' ? 'bg-gray-100 text-dark' : 'bg-primary text-white'} rounded-xl text-sm font-bold`}>
                            View Details
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </section>
              )}

              {filteredOrders.length === 0 && (
                <div className="text-center py-12 text-muted">
                   <p>No orders found for this category.</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Order Details Modal */}
      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] p-0 gap-0">
          <DialogHeader className="flex flex-row items-center justify-between px-5 py-4 border-b sticky top-0 bg-background z-10">
            <DialogTitle className="text-lg font-bold">
              Order #{selectedOrder?.order_number?.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <ScrollArea className="max-h-[70vh]">
              <div className="px-5 pb-6 pt-4 space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-sm font-bold capitalize">{selectedOrder.status.replace(/_/g, ' ')}</span>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-sm font-bold mb-3 text-muted-foreground uppercase tracking-wider">
                    {selectedOrder.order_items?.length || 0} Item{(selectedOrder.order_items?.length || 0) > 1 ? 's' : ''}
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.order_items?.map((item: any) => {
                      const imgUrl = item.product_snapshot?.image_url || item.product_snapshot?.primary_image_url || '/placeholder.svg';
                      return (
                        <div key={item.id} className="flex items-center gap-3 bg-muted/30 rounded-xl p-3">
                          <img src={imgUrl} alt={item.product_snapshot?.name} className="w-14 h-14 rounded-lg object-contain bg-white border p-1" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{item.product_snapshot?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.product_snapshot?.unit_value} {item.product_snapshot?.unit_type} × {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-bold shrink-0">₹{Math.round(item.total_price)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{selectedOrder.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span>{selectedOrder.delivery_fee === 0 ? 'FREE' : `₹${selectedOrder.delivery_fee?.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Fee</span>
                    <span>₹{selectedOrder.platform_fee?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t pt-2">
                    <span>Total</span>
                    <span>₹{selectedOrder.total_amount?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment */}
                <div className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-3">
                  <span className="text-sm text-muted-foreground">Payment</span>
                  <span className="text-sm font-bold uppercase">{selectedOrder.payment_method}</span>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep Order</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (orderToCancel) {
                  cancelOrder.mutate(orderToCancel);
                }
                setCancelDialogOpen(false);
                setOrderToCancel(null);
              }}
            >
              Yes, Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CustomerLayout>
  );
};

export default OrdersPage;
