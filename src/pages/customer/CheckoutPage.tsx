import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
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
  Home,
  Shield,
  Tag
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
  const [showAddressList, setShowAddressList] = useState(false);

  useEffect(() => {
    if (defaultAddress && !selectedAddress) {
      setSelectedAddress(defaultAddress);
    } else if (addresses.length > 0 && !selectedAddress) {
      setSelectedAddress(addresses[0]);
    }
  }, [defaultAddress, selectedAddress, addresses]);

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
  const totalSavings = items.reduce((acc, item) => acc + ((item.mrp - item.selling_price) * item.quantity), 0);

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
      setShowAddressList(true);
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
    <div className="min-h-screen bg-[#f1f3f6] text-[#212121] font-sans">
      
      {/* Header - Full Width */}
      <header className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-[#212121] hover:bg-muted rounded-full p-1 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[#212121]">Checkout</h1>
            <p className="text-xs text-muted-foreground">
              {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} in cart
            </p>
          </div>
          <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="w-4 h-4 text-primary" />
            <span>100% Secure</span>
          </div>
        </div>
      </header>

      {/* Two Column Layout */}
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-5 pb-36 lg:pb-6">
        <div className="flex flex-col lg:flex-row gap-5">
          
          {/* LEFT COLUMN - Address + Payment */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Step 1: Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 bg-[#2874f0] text-white">
                <span className="w-6 h-6 rounded-sm bg-white/20 flex items-center justify-center text-xs font-bold">1</span>
                <span className="text-sm font-bold uppercase tracking-wide">Delivery Address</span>
              </div>
              <div className="p-5">
                {selectedAddress ? (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {selectedAddress.address_type === 'home' ? <Home className="w-4 h-4 text-muted-foreground" /> : <Building2 className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <span className="text-sm font-bold capitalize bg-muted px-2 py-0.5 rounded text-foreground">
                          {selectedAddress.address_type}
                        </span>
                        <p className="text-sm text-[#212121] mt-2 leading-relaxed">
                          {selectedAddress.address_line1}
                          {selectedAddress.address_line2 && `, ${selectedAddress.address_line2}`}
                          {selectedAddress.landmark && `, ${selectedAddress.landmark}`}
                        </p>
                        <p className="text-sm text-[#212121]">
                          {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-xs"
                      onClick={() => setShowAddressList(!showAddressList)}
                    >
                      {showAddressList ? 'Close' : 'Change'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">No address selected</p>
                    <Button size="sm" onClick={() => setShowAddressForm(true)}>
                      <Plus className="w-4 h-4 mr-1" /> Add Address
                    </Button>
                  </div>
                )}

                {/* Address List */}
                <AnimatePresence>
                  {showAddressList && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-4"
                    >
                      <Separator className="mb-4" />
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Saved Addresses</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-primary"
                          onClick={() => { setEditingAddress(null); setShowAddressForm(true); }}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add New
                        </Button>
                      </div>
                      {addressesLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : addresses.length === 0 ? (
                        <p className="text-center py-4 text-xs text-muted-foreground">No saved addresses.</p>
                      ) : (
                        <div className="space-y-2 max-h-[280px] overflow-y-auto">
                          {addresses.map(addr => (
                            <div
                              key={addr.id}
                              className={cn(
                                "p-3 rounded-lg border text-sm cursor-pointer flex items-center justify-between transition-colors",
                                selectedAddress?.id === addr.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                              )}
                              onClick={() => { setSelectedAddress(addr); setShowAddressList(false); }}
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                {addr.address_type === 'home' ? <Home className="w-4 h-4 text-muted-foreground shrink-0" /> : <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />}
                                <div className="truncate">
                                  <span className="font-semibold capitalize">{addr.address_type}</span>
                                  <span className="text-muted-foreground ml-2">{addr.address_line1}, {addr.city}</span>
                                </div>
                              </div>
                              {selectedAddress?.id === addr.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 bg-[#2874f0] text-white">
                <span className="w-6 h-6 rounded-sm bg-white/20 flex items-center justify-center text-xs font-bold">2</span>
                <span className="text-sm font-bold uppercase tracking-wide">Payment Options</span>
              </div>
              <div className="p-5 space-y-3">
                {/* UPI */}
                <div
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                    paymentMethod === 'upi' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  )}
                  onClick={() => setPaymentMethod('upi')}
                >
                  <div className="w-10 h-10 border border-border rounded-lg flex items-center justify-center bg-muted/30">
                    <Smartphone className="w-5 h-5 text-[#2b78ff]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold">UPI</h3>
                    <p className="text-xs text-muted-foreground">Pay using any UPI app</p>
                  </div>
                  {paymentMethod === 'upi' && <Check className="w-5 h-5 text-primary" />}
                </div>

                {/* Card */}
                <div
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                    paymentMethod === 'card' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  )}
                  onClick={() => setPaymentMethod('card')}
                >
                  <div className="w-10 h-10 border border-border rounded-lg flex items-center justify-center bg-muted/30">
                    <CreditCard className="w-5 h-5 text-[#2b78ff]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold">Credit / Debit Card</h3>
                    <p className="text-xs text-muted-foreground">Visa, Mastercard, RuPay</p>
                  </div>
                  {paymentMethod === 'card' && <Check className="w-5 h-5 text-primary" />}
                </div>

                {/* Cash */}
                <div
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                    paymentMethod === 'cash' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  )}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <div className="w-10 h-10 border border-border rounded-lg flex items-center justify-center bg-muted/30">
                    <Banknote className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold">Cash on Delivery</h3>
                    <p className="text-xs text-muted-foreground">Pay when you receive</p>
                  </div>
                  {paymentMethod === 'cash' && <Check className="w-5 h-5 text-primary" />}
                </div>
              </div>
            </div>

            {/* Delivery Instructions */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 bg-[#2874f0] text-white">
                <span className="w-6 h-6 rounded-sm bg-white/20 flex items-center justify-center text-xs font-bold">3</span>
                <span className="text-sm font-bold uppercase tracking-wide">Delivery Instructions</span>
              </div>
              <div className="p-5">
                <Textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="border-border bg-muted/30 resize-none focus:border-primary"
                  rows={3}
                  placeholder="Any special instructions..."
                />
              </div>
            </div>

            {/* Desktop Place Order Button */}
            <div className="hidden lg:block">
              <Button
                onClick={handlePlaceOrder}
                className="w-full bg-[#fb641b] hover:bg-[#e85d19] text-white font-bold h-14 rounded-lg text-base shadow-lg"
                disabled={isPlacingOrder || !selectedAddress}
              >
                {isPlacingOrder ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <>Place Order • ₹{total.toFixed(0)}</>
                )}
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN - Order Summary (Sticky on Desktop) */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="lg:sticky lg:top-[80px] space-y-4">
              
              {/* Order Items */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Order Summary</h3>
                </div>
                <div className="p-5">
                  <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.product_id} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg border border-border flex items-center justify-center bg-muted/30 overflow-hidden shrink-0">
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} × ₹{item.selling_price}
                          </p>
                        </div>
                        <span className="text-sm font-semibold shrink-0">₹{(item.selling_price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Price Breakdown */}
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Item Total</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span className={deliveryFee === 0 ? 'text-primary font-medium' : ''}>
                        {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform Fee</span>
                      <span>₹{platformFee}</span>
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="flex justify-between text-base font-bold">
                      <span>Total Payable</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Savings badge */}
                  {totalSavings > 0 && (
                    <div className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-2 text-sm">
                      <Tag className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-primary font-semibold">You save ₹{totalSavings.toFixed(0)} on this order!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Trust badges */}
              <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Safe & Secure</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  <span>Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-40">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-lg font-bold">₹{total.toFixed(0)}</span>
            <button className="text-xs text-primary font-medium">View details</button>
          </div>
          <Button
            onClick={handlePlaceOrder}
            className="flex-1 max-w-[220px] bg-[#fb641b] hover:bg-[#e85d19] text-white font-bold h-12 rounded-lg text-base"
            disabled={isPlacingOrder || !selectedAddress}
          >
            {isPlacingOrder ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing</>
            ) : (
              'Place Order'
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
