import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { useOrders } from '@/hooks/useOrders';
import { useCustomerCredits } from '@/hooks/useCustomerCredits';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Backend Hooks
  const { data: orders, isLoading: isOrdersLoading } = useOrders();
  const { creditBalance, creditLimit } = useCustomerCredits();
  const addItem = useCartStore((state) => state.addItem);

  const totalUsed = (creditLimit || 0) - (creditBalance || 0);

  // Filter Logic
  const filteredOrders = orders?.filter(order => {
    if (activeFilter === 'Active') return ['pending', 'processing', 'out_for_delivery'].includes(order.status);
    if (activeFilter === 'Delivered') return order.status === 'delivered';
    if (activeFilter === 'Cancelled') return order.status === 'cancelled';
    if (activeFilter === 'On Credit') return order.payment_method === 'credit';
    return true;
  }) || [];

  const activeOrders = filteredOrders.filter(o => ['pending', 'processing', 'out_for_delivery'].includes(o.status));
  const pastOrders = filteredOrders.filter(o => ['delivered', 'cancelled', 'returned'].includes(o.status));

  // Reorder Function
  const handleReorder = (order: any) => {
    if (!order.order_items) return;
    
    order.order_items.forEach((item: any) => {
      if (item.product) {
        addItem({ ...item.product, quantity: item.quantity });
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
      case 'pending': return { label: 'Order Placed', color: 'text-secondary', progress: 'w-1/3' };
      case 'processing': return { label: 'In Progress', color: 'text-secondary', progress: 'w-1/2' };
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
                            <span className="text-xs font-semibold text-muted uppercase">Order #{order.id.slice(0,8)}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="inline-block w-2 h-2 rounded-full bg-secondary pulse-dot"></span>
                              <span className="text-sm font-bold text-secondary uppercase">{statusInfo.label}</span>
                            </div>
                          </div>
                          <span className="text-xs text-muted">Placed {format(new Date(order.created_at), 'p')}</span>
                        </div>

                        {/* Progress Tracker */}
                        <div className="relative flex justify-between items-center mb-6 px-2">
                          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 -z-0"></div>
                          <div className={`absolute top-1/2 left-0 ${statusInfo.progress} h-0.5 bg-primary -translate-y-1/2 -z-0 transition-all duration-500`}></div>
                          
                          <div className="z-10 bg-primary text-white rounded-full p-1 border-2 border-white">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          </div>
                          <div className={`z-10 ${['processing', 'out_for_delivery'].includes(order.status) ? 'bg-primary text-white ring-4 ring-primary/10' : 'bg-gray-100 text-gray-300'} rounded-full p-1 border-2 border-white`}>
                            {['processing', 'out_for_delivery'].includes(order.status) ? (
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
                           order.status === 'processing' ? 'Your order is being prepared' : 
                           'Driver is on the way'}
                        </p>

                        {/* Delivery Partner Details (Mocked if not assigned) */}
                        {order.status === 'out_for_delivery' && (
                          <div className="flex items-center justify-between bg-surface rounded-xl p-3 mb-4">
                            <div className="flex items-center gap-3">
                              <img alt="Driver" className="w-10 h-10 rounded-full object-cover border border-gray-200" src="/placeholder.svg" />
                              <div>
                                <p className="text-xs text-muted">Delivering by</p>
                                <p className="text-sm font-bold text-dark">Delivery Partner</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button className="bg-white p-2 rounded-full border border-gray-200 shadow-sm">
                                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Order Items Scroll */}
                        <div className="flex gap-3 overflow-x-auto no-scrollbar mb-4">
                          {order.order_items?.slice(0, 4).map((item: any) => (
                            <img key={item.id} alt={item.product?.name} className="w-14 h-14 rounded-lg flex-shrink-0 bg-white border border-gray-100 object-contain p-1" src={item.product?.primary_image_url || "/placeholder.svg"} />
                          ))}
                          {order.order_items?.length > 4 && (
                            <div className="w-14 h-14 rounded-lg flex-shrink-0 bg-surface flex items-center justify-center text-xs font-bold text-primary">
                              +{order.order_items.length - 4}
                            </div>
                          )}
                        </div>

                        {/* Action Links */}
                        <div className="flex justify-between items-center border-t border-gray-100 pt-4 px-1">
                          <button onClick={() => navigate(`/orders/${order.id}`)} className="text-primary font-bold text-sm">View Full Order</button>
                          {order.status === 'pending' && <button className="text-red-600 font-medium text-sm">Cancel Order</button>}
                        </div>
                      </div>
                    )
                  })}
                </section>
              )}

              {/* Credit Summary (Shows if user has credit limit or On Credit tab is active) */}
              {(creditLimit > 0 || activeFilter === 'On Credit') && (
                <section>
                  <div className="bg-gradient-to-br from-dark to-primary rounded-card p-5 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-lg font-bold">Ahmad Credit Card</h3>
                          <p className="text-[10px] opacity-70 tracking-widest uppercase">Verified Local Member</p>
                        </div>
                        <div className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold">ON CREDIT</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-[10px] opacity-70 uppercase mb-0.5">Total Used</p>
                          <p className="text-base font-bold">₹{totalUsed}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] opacity-70 uppercase mb-0.5">Available</p>
                          <p className="text-base font-bold text-green-300">₹{creditBalance}</p>
                        </div>
                      </div>

                      <div className="w-full bg-white/20 h-1.5 rounded-full mb-4">
                        <div className="bg-white h-1.5 rounded-full transition-all" style={{ width: `${(totalUsed / creditLimit) * 100}%` }}></div>
                      </div>

                      <div className="flex justify-between items-center">
                        <p className="text-[10px] opacity-80">Next Settlement: <span className="font-bold">1st {format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'MMMM yyyy')}</span></p>
                        <button onClick={() => navigate('/profile')} className="bg-white text-primary px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">View Statement</button>
                      </div>
                    </div>
                    {/* Decorative Circle */}
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
                              <span className="text-sm font-bold text-dark uppercase">#{order.id.slice(0,8)}</span>
                              <span className={`${statusInfo.color} text-[10px] px-2 py-0.5 rounded font-bold uppercase`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <p className="text-xs text-muted mt-0.5">{format(new Date(order.created_at), 'do MMMM yyyy')}</p>
                          </div>
                          <p className="text-sm font-bold text-dark">₹{order.total_amount}</p>
                        </div>
                        
                        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                          {order.order_items?.slice(0, 4).map((item: any) => (
                            <img key={item.id} alt={item.product?.name} className={`w-10 h-10 rounded border border-gray-50 object-contain p-0.5 ${order.status === 'cancelled' ? 'grayscale' : ''}`} src={item.product?.primary_image_url || "/placeholder.svg"} />
                          ))}
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
                          <button onClick={() => navigate(`/orders/${order.id}`)} className={`py-2.5 px-4 ${order.status === 'cancelled' ? 'bg-gray-100 text-dark' : 'bg-primary text-white'} rounded-xl text-sm font-bold`}>
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
    </CustomerLayout>
  );
};

export default OrdersPage;
