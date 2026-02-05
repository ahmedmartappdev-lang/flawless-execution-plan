import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Plus,
  CreditCard,
  Banknote,
  Smartphone,
  Check,
  ChevronRight,
  ShoppingBag,
  Loader2,
  PartyPopper,
  Wallet,
  Building2,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { AddressForm } from '@/components/customer/AddressForm';
import { useAddresses, Address, AddressInput } from '@/hooks/useAddresses';
import { useOrders } from '@/hooks/useOrders';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type PaymentMethod = 'cash' | 'upi' | 'card';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, getTotalAmount, getDeliveryFee, getTotalItems } = useCartStore();
  const { addresses, defaultAddress, isLoading: addressesLoading, addAddress, updateAddress } = useAddresses();
  const { createOrder } = useOrders();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerNotes, setCustomerNotes] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: string } | null>(null);
  
  // Toggle for the address list dropdown
  const [showAddressList, setShowAddressList] = useState(false);

  // Initialize selected address
  useEffect(() => {
    if (defaultAddress && !selectedAddress) {
      setSelectedAddress(defaultAddress);
    } else if (addresses.length > 0 && !selectedAddress) {
      setSelectedAddress(addresses[0]);
    }
  }, [defaultAddress, selectedAddress, addresses]);

  // Auth & Cart Validation
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    } else if (items.length === 0 && !orderSuccess) {
      navigate('/cart');
    }
  }, [isAuthenticated, items.length, navigate, orderSuccess]);

  const subtotal = getTotalAmount();
  const deliveryFee = getDeliveryFee();
  const platformFee = 5;
  const total = subtotal + deliveryFee + platformFee;

  const handleAddAddress = async (data: AddressInput) => {
    await addAddress.mutateAsync(data);
    setShowAddressForm(false);
  };

  const handleUpdateAddress = async (data: AddressInput) => {
    if (editingAddress) {
      await updateAddress.mutateAsync({ id: editingAddress.id, ...data });
      setEditingAddress(null);
      setShowAddressForm(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address');
      setShowAddressList(true); // Auto-open list if they try to proceed without address
      return;
    }
    
    setIsPlacingOrder(true);
    try {
      const order = await createOrder.mutateAsync({
        address: selectedAddress,
        paymentMethod,
        customerNotes: customerNotes || undefined,
      });
      setOrderSuccess({ orderNumber: order.order_number });
    } catch (error) {
      console.error('Order failed:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <PartyPopper className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Order Placed!</h1>
          <p className="text-muted-foreground mb-2">Your order has been placed successfully</p>
          <p className="text-sm font-medium bg-muted px-4 py-2 rounded-lg mb-6">
            Order #{orderSuccess.orderNumber}
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate('/orders')} className="w-full">
              <ShoppingBag className="w-4 h-4 mr-2" />
              View My Orders
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              Continue Shopping
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#282c3f] font-sans pb-32">
      
      {/* Header */}
      <header className="bg-white px-[5%] py-5 flex items-center gap-5 sticky top-0 z-50 border-b border-[#f0f0f0]">
        <button onClick={() => navigate(-1)} className="text-[#282c3f] cursor-pointer">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-base font-bold text-[#282c3f]">Payment Options</h1>
          <p className="text-xs text-[#7e808c] mt-0.5">
            {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''}. Total: ₹{total.toFixed(2)}
          </p>
        </div>
      </header>

      {/* Address Selection Section */}
      <div className="bg-white px-[5%] py-5 flex gap-4 relative">
        <div className="flex flex-col items-center pt-1.5">
          <div className="w-2 h-2 rounded-full border-[2px] border-[#60b246] bg-white z-10"></div>
          <div className="w-[2px] h-10 bg-[#e9e9eb] -my-1"></div>
          <div className="w-2 h-2 border-[2px] border-[#5d8ed5] bg-white z-10"></div>
        </div>

        <div className="flex-1">
          <div className="text-[13px] leading-relaxed mb-4">
            <div className="mb-4">
              <span className="font-bold text-[#282c3f]">Instamart</span>
              <span className="text-[#7e808c]"> | {items[0]?.vendor_id ? 'Store Location' : 'Ahmed Mart Store'}</span>
            </div>
            
            <div className="relative group">
              <div className="flex items-start justify-between">
                <div>
                  {selectedAddress ? (
                    <>
                      <span className="font-bold text-[#282c3f] capitalize">
                        {selectedAddress.address_type}
                      </span>
                      <span className="text-[#7e808c]"> | </span>
                      <span className="text-[#7e808c]">
                        {selectedAddress.address_line1}, {selectedAddress.city} - {selectedAddress.pincode}
                      </span>
                    </>
                  ) : (
                    <span className="text-red-500 font-medium">No address selected</span>
                  )}
                </div>
                
                {/* Click to Toggle Address List */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs border-[#e9e9eb] ml-2 shrink-0"
                  onClick={() => setShowAddressList(!showAddressList)}
                >
                  {showAddressList ? 'Close' : selectedAddress ? 'Change' : 'Select Address'}
                </Button>
              </div>

              {/* Collapsible Address List */}
              <AnimatePresence>
                {showAddressList && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-3"
                  >
                    <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                       <div className="flex justify-between items-center mb-2">
                         <span className="text-xs font-semibold text-[#282c3f]">Saved Addresses</span>
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-6 text-xs text-primary"
                           onClick={() => {
                             setEditingAddress(null);
                             setShowAddressForm(true);
                           }}
                         >
                           <Plus className="w-3 h-3 mr-1" /> Add New
                         </Button>
                       </div>
                       
                       {addressesLoading ? (
                         <div className="flex justify-center py-2">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                         </div>
                       ) : addresses.length === 0 ? (
                          <div className="text-center py-2 text-xs text-muted-foreground">No saved addresses found.</div>
                       ) : (
                         <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                           {addresses.map(addr => (
                             <div 
                               key={addr.id} 
                               className={cn(
                                 "p-3 rounded border text-xs cursor-pointer flex items-center justify-between hover:bg-white transition-colors",
                                 selectedAddress?.id === addr.id ? "border-[#60b246] bg-[#f0fff4]" : "border-gray-200 bg-white"
                               )}
                               onClick={() => {
                                 setSelectedAddress(addr);
                                 setShowAddressList(false); // Close list after selection
                               }}
                             >
                               <div className="flex items-center gap-2 overflow-hidden">
                                  {addr.address_type === 'home' && <Home className="w-3.5 h-3.5 text-[#666]" />}
                                  {addr.address_type === 'work' && <Building2 className="w-3.5 h-3.5 text-[#666]" />}
                                  <div className="flex flex-col truncate">
                                    <span className="font-semibold capitalize text-[#282c3f]">{addr.address_type}</span>
                                    <span className="truncate text-[#7e808c]">{addr.address_line1}, {addr.city}</span>
                                  </div>
                               </div>
                               {selectedAddress?.id === addr.id && <Check className="w-4 h-4 text-[#60b246] shrink-0" />}
                             </div>
                           ))}
                         </div>
                       )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="font-bold text-[13px] text-[#282c3f]">
            Delivery In: 15 mins
          </div>
        </div>
      </div>

      {/* Main Payment Section */}
      <div className="bg-[#f2f3f5] px-[5%] py-8 min-h-[60vh] rounded-t-[30px] shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        
        {/* UPI Option */}
        <div className="flex items-center gap-2.5 text-sm font-bold text-[#1c1c1c] mb-4">
          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" className="w-[35px]" alt="UPI" />
          Pay by any UPI App
        </div>
        <div className="bg-white rounded-[16px] mb-[25px] overflow-hidden">
          <div 
            className={cn(
              "flex items-center gap-[15px] px-[20px] py-[15px] cursor-pointer transition-colors border-b border-dashed border-[#e9e9eb] last:border-0",
              paymentMethod === 'upi' ? "bg-blue-50/50" : "hover:bg-gray-50"
            )}
            onClick={() => setPaymentMethod('upi')}
          >
            <div className="w-[40px] h-[40px] border border-[#e9e9eb] rounded-[8px] flex items-center justify-center text-[20px] text-[#2b78ff]">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#2b78ff]">Add New UPI ID</h3>
              <p className="text-[11px] text-[#7e808c] mt-[2px]">You need to have a registered UPI ID</p>
            </div>
            {paymentMethod === 'upi' && <Check className="w-5 h-5 text-[#2b78ff] ml-auto" />}
          </div>
        </div>

        {/* Card Option */}
        <div className="flex items-center gap-2.5 text-sm font-bold text-[#1c1c1c] mb-4">
          Credit & Debit Cards
        </div>
        <div className="bg-white rounded-[16px] mb-[25px] overflow-hidden">
          <div 
            className={cn(
              "flex items-center gap-[15px] px-[20px] py-[15px] cursor-pointer transition-colors border-b border-dashed border-[#e9e9eb] last:border-0",
              paymentMethod === 'card' ? "bg-blue-50/50" : "hover:bg-gray-50"
            )}
            onClick={() => setPaymentMethod('card')}
          >
            <div className="w-[40px] h-[40px] border border-[#e9e9eb] rounded-[8px] flex items-center justify-center text-[20px] text-[#2b78ff]">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#2b78ff]">Add New Card</h3>
              <p className="text-[11px] text-[#7e808c] mt-[2px]">Save and Pay via Cards.</p>
            </div>
            {paymentMethod === 'card' && <Check className="w-5 h-5 text-[#2b78ff] ml-auto" />}
          </div>
        </div>

        {/* More Options */}
        <div className="flex items-center gap-2.5 text-sm font-bold text-[#1c1c1c] mb-4">
          More Payment Options
        </div>
        <div className="bg-white rounded-[16px] mb-[25px] overflow-hidden">
          <div className="flex items-center justify-between px-[20px] py-[20px] border-b border-dashed border-[#e9e9eb] cursor-pointer hover:bg-gray-50">
            <div className="flex items-center gap-[15px]">
              <div className="w-[40px] h-[40px] border border-[#e9e9eb] rounded-[8px] flex items-center justify-center text-[20px] text-[#666]">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[#282c3f]">Wallets</h3>
                <p className="text-[11px] text-[#7e808c] mt-[2px]">PhonePe, Amazon Pay & more</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#7e808c]" />
          </div>

          <div className="flex items-center justify-between px-[20px] py-[20px] border-b border-dashed border-[#e9e9eb] cursor-pointer hover:bg-gray-50">
            <div className="flex items-center gap-[15px]">
              <div className="w-[40px] h-[40px] border border-[#e9e9eb] rounded-[8px] flex items-center justify-center text-[20px] text-[#666]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[#282c3f]">Netbanking</h3>
                <p className="text-[11px] text-[#7e808c] mt-[2px]">Select from a list of banks</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#7e808c]" />
          </div>

          <div 
            className={cn(
              "flex items-center justify-between px-[20px] py-[20px] cursor-pointer transition-colors",
              paymentMethod === 'cash' ? "bg-green-50/50" : "hover:bg-gray-50"
            )}
            onClick={() => setPaymentMethod('cash')}
          >
            <div className="flex items-center gap-[15px]">
              <div className="w-[40px] h-[40px] border border-[#e9e9eb] rounded-[8px] flex items-center justify-center text-[20px] text-[#666]">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-[#282c3f]">Pay on Delivery</h3>
                <p className="text-[11px] text-[#7e808c] mt-[2px]">Pay in cash or pay online.</p>
              </div>
            </div>
            {paymentMethod === 'cash' ? (
               <Check className="w-5 h-5 text-[#60b246]" />
            ) : (
               <ChevronRight className="w-4 h-4 text-[#7e808c]" />
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="flex items-center gap-2.5 text-sm font-bold text-[#1c1c1c] mb-4">
          Order Summary
        </div>
        <div className="bg-white rounded-[16px] mb-[25px] p-5">
           <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.product_id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded border border-[#e9e9eb] flex items-center justify-center bg-gray-50 overflow-hidden">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-[#282c3f]">{item.name}</p>
                    <p className="text-xs text-[#7e808c]">
                      {item.quantity} x ₹{item.selling_price}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[#282c3f]">₹{(item.selling_price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
           </div>
           
           <Separator className="bg-[#e9e9eb] mb-4" />
           
           <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#7e808c]">Item Total</span>
              <span className="text-[#282c3f]">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7e808c]">Delivery Fee</span>
              <span className={deliveryFee === 0 ? 'text-[#60b246] font-medium' : 'text-[#282c3f]'}>
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7e808c]">Platform Fee</span>
              <span className="text-[#282c3f]">₹{platformFee}</span>
            </div>
            <div className="my-2 border-t border-dashed border-[#e9e9eb]"></div>
            <div className="flex justify-between text-base font-bold text-[#282c3f]">
              <span>To Pay</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
           </div>
        </div>

        {/* Instructions */}
        <div className="flex items-center gap-2.5 text-sm font-bold text-[#1c1c1c] mb-4">
          Delivery Instructions
        </div>
        <div className="bg-white rounded-[16px] p-5 mb-[25px]">
          <Textarea
            placeholder="Any special instructions for the delivery partner..."
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            className="border-[#e9e9eb] focus:border-[#60b246] bg-gray-50/50 resize-none"
            rows={3}
          />
        </div>

      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#f0f0f0] p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-md mx-auto w-full flex items-center justify-between gap-4">
           <div className="flex flex-col">
             <span className="text-xs text-[#7e808c] font-medium">PAYING VIA</span>
             <span className="text-sm font-bold text-[#282c3f] flex items-center gap-1">
               {paymentMethod === 'cash' && <><Banknote className="w-4 h-4" /> Cash on Delivery</>}
               {paymentMethod === 'upi' && <><Smartphone className="w-4 h-4" /> UPI</>}
               {paymentMethod === 'card' && <><CreditCard className="w-4 h-4" /> Card</>}
             </span>
           </div>
           
           <Button
             onClick={handlePlaceOrder}
             className="flex-1 bg-[#60b246] hover:bg-[#539e3d] text-white font-bold h-12 rounded-xl text-base shadow-lg shadow-green-100"
             disabled={isPlacingOrder || !selectedAddress}
           >
             {isPlacingOrder ? (
               <>
                 <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                 Processing...
               </>
             ) : (
               <>Place Order • ₹{total.toFixed(0)}</>
             )}
           </Button>
        </div>
      </div>

      <AddressForm
        open={showAddressForm}
        onOpenChange={(open) => {
          setShowAddressForm(open);
          if (!open) setEditingAddress(null);
        }}
        onSubmit={editingAddress ? handleUpdateAddress : handleAddAddress}
        initialData={editingAddress}
        isLoading={addAddress.isPending || updateAddress.isPending}
      />
    </div>
  );
};

export default CheckoutPage;
