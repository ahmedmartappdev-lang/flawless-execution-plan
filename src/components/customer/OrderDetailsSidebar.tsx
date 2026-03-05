import React from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetClose 
} from '@/components/ui/sheet';
import { X, CheckCircle2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useOrders } from '@/hooks/useOrders';
import { toast } from 'sonner';

interface OrderDetailsSidebarProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrderDetailsSidebar: React.FC<OrderDetailsSidebarProps> = ({ 
  order, 
  open, 
  onOpenChange 
}) => {
  const { cancelOrder } = useOrders();
  
  if (!order) return null;

  const orderItems = order.order_items || [];
  const address = order.delivery_address || {};
  
  // Calculate approximate tax if not provided (mock logic for display)
  const taxes = order.platform_fee ? order.platform_fee * 0.18 : 0;

  const handleCancelOrder = () => {
    if (confirm('Are you sure you want to cancel this order?')) {
      cancelOrder.mutate(order.id, {
        onSuccess: () => {
          onOpenChange(false);
        }
      });
    }
  };

  const isCancellable = order.status === 'pending';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        className="w-full sm:max-w-[450px] p-0 bg-white text-[#282c3f] border-l shadow-2xl sm:w-[450px]" 
        side="right"
      >
        {/* Header */}
        <div className="flex items-center gap-4 p-6 pb-4">
          <SheetClose className="text-[#3d4152] hover:opacity-70 transition-opacity">
            <X className="w-6 h-6" />
          </SheetClose>
          <h2 className="text-[18px] font-bold tracking-tight text-[#282c3f]">
            Order #{order.order_number}
          </h2>
        </div>

        <ScrollArea className="h-[calc(100vh-140px)]"> {/* Adjusted height to make room for footer if needed */}
          <div className="px-8 py-2">
            
            {/* Address Stepper */}
            <div className="relative pl-8 mb-8 mt-2">
              {/* Vertical Dashed Line */}
              <div className="absolute left-[9px] top-3 bottom-10 w-[1px] border-l border-dashed border-[#a9abb2]"></div>

              {/* Source Step */}
              <div className="relative mb-8">
                <div className="absolute -left-[29px] top-1.5 w-[14px] h-[14px] bg-white border-[2px] border-[#282c3f] rounded-full z-10"></div>
                <div className="text-[15px] font-bold text-[#282c3f] leading-tight mb-1">Store Location</div>
                <div className="text-[12px] text-[#686b78] leading-snug">
                  Ahmed Mart Store, Greater Noida
                </div>
              </div>

              {/* Destination Step */}
              <div className="relative">
                <div className="absolute -left-[29px] top-1.5 w-[14px] h-[14px] bg-white border-[2px] border-[#282c3f] rounded-[2px] z-10"></div>
                <div className="text-[15px] font-bold text-[#282c3f] leading-tight mb-1 capitalize">
                  {address.address_type || 'Delivery Location'}
                </div>
                <div className="text-[12px] text-[#686b78] leading-snug">
                  {address.address_line1}, {address.city} - {address.pincode}
                </div>
              </div>
            </div>

            {/* Static Map Preview */}
            {order.delivery_latitude && order.delivery_longitude && (
              <div className="mb-6 rounded-lg overflow-hidden border border-border">
                <img
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${order.delivery_latitude},${order.delivery_longitude}&zoom=16&size=400x200&scale=2&markers=color:red%7C${order.delivery_latitude},${order.delivery_longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}`}
                  alt="Delivery location"
                  className="w-full h-[140px] object-cover"
                  loading="lazy"
                />
                <div className="px-3 py-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {Number(order.delivery_latitude).toFixed(4)}, {Number(order.delivery_longitude).toFixed(4)}
                </div>
              </div>
            )}

            {/* Delivery Log */}
            <div className="flex items-start gap-3 py-5 border-t border-[#e9e9eb] mb-5">
              <div className="mt-0.5 text-[#60b246]">
                <CheckCircle2 className="w-5 h-5 fill-[#60b246] text-white" />
              </div>
              <div className="text-[12px] text-[#686b78] leading-relaxed">
                <span className="font-semibold text-[#3d4152] capitalize">
                  {order.status.replace('_', ' ')}
                </span>
                <br />
                on {format(new Date(order.created_at), 'EEE, MMM d, yyyy, h:mm a')}
              </div>
            </div>

            {/* Items Section */}
            <div className="mb-6">
              <div className="text-[11px] font-bold text-[#7e808c] uppercase tracking-wider mb-4">
                {orderItems.length} ITEM{orderItems.length > 1 ? 'S' : ''}
              </div>

              {orderItems.map((item: any) => (
                <div key={item.id} className="mb-4">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex gap-3">
                      {/* Veg/Non-veg Indicator (Mocking Veg as default green square) */}
                      <div className="mt-1 w-[14px] h-[14px] border border-[#60b246] flex items-center justify-center shrink-0">
                        <div className="w-[6px] h-[6px] bg-[#60b246] rounded-full"></div>
                      </div>
                      <div>
                        <div className="text-[14px] font-semibold text-[#282c3f]">
                          {item.product_snapshot?.name || 'Product Name'}
                        </div>
                        <div className="text-[11px] text-[#7e808c] mt-1">
                          {item.product_snapshot?.unit_value} {item.product_snapshot?.unit_type}
                          {item.quantity > 1 && ` x ${item.quantity}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-[14px] text-[#3d4152]">
                      ₹{Math.round(item.total_price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bill Details */}
            <div className="border-t border-[#e9e9eb] pt-5 pb-20">
              <div className="text-[11px] font-bold text-[#282c3f] mb-3">BILL DETAILS</div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-[13px] text-[#686b78]">
                  <span>Item Total</span>
                  <span>₹{order.subtotal?.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-[13px] text-[#686b78]">
                  <span>Delivery Fee</span>
                  {order.delivery_fee === 0 ? (
                    <span className="text-[#60b246]">FREE</span>
                  ) : (
                    <span>₹{order.delivery_fee?.toFixed(2)}</span>
                  )}
                </div>

                <div className="flex justify-between text-[13px] text-[#686b78]">
                  <span>Platform Fee</span>
                  <span>₹{order.platform_fee?.toFixed(2) || '5.00'}</span>
                </div>

                <div className="flex justify-between text-[13px] text-[#686b78] border-b border-[#e9e9eb] pb-4">
                  <span>Taxes and Charges</span>
                  <span>₹{taxes.toFixed(2)}</span>
                </div>

                {/* Footer Total */}
                <div className="flex justify-between items-center pt-2">
                  <div className="text-[12px] font-bold text-[#282c3f] uppercase bg-[#e9f5e8] px-2 py-1 rounded">
                    Paid via {order.payment_method}
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-bold text-[#282c3f]">BILL TOTAL</div>
                    <div className="text-[16px] font-extrabold text-[#282c3f]">
                      ₹{order.total_amount?.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer with Cancel Button */}
        {isCancellable && (
          <div className="absolute bottom-0 left-0 w-full p-4 bg-white border-t">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleCancelOrder}
              disabled={cancelOrder.isPending}
            >
              {cancelOrder.isPending ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
