import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Banknote,
  Smartphone,
  Check,
  ShoppingBag,
  Loader2,
  PartyPopper,
  Wallet,
  Building2,
  Home,
  Shield,
  Tag,
  Bell,
  DoorOpen,
  Phone,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  CreditCard,
  Info,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AddressForm } from '@/components/customer/AddressForm';
import { BottomNavigation } from '@/components/customer/BottomNavigation';
import { useAddresses, Address, AddressInput } from '@/hooks/useAddresses';
import { useOrders } from '@/hooks/useOrders';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCustomerCredits } from '@/hooks/useCustomerCredits';
import { useDeliveryFeeConfig, computeDeliveryFee } from '@/hooks/useDeliveryFeeConfig';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';


type PaymentMethod = 'cash' | 'upi' | 'credit';

const DELIVERY_INSTRUCTIONS = [
  { id: 'ring', label: 'Ring the bell', icon: Bell },
  { id: 'door', label: 'Leave at door', icon: DoorOpen },
  { id: 'call', label: 'Call me', icon: Phone },
  { id: 'guard', label: 'Guard room', icon: ShieldCheck },
];

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { user } = useAuthStore();
  const { items, getTotalAmount, getDeliveryFee, getTotalItems } = useCartStore();
  const { addresses, defaultAddress, isLoading: addressesLoading, addAddress, updateAddress } = useAddresses();
  const { creditBalance } = useCustomerCredits();
  const { createOrder } = useOrders();
  const { data: feeConfig } = useDeliveryFeeConfig();

  // Fetch user profile name
  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch app name from settings
  const { data: appNameSetting } = useQuery({
    queryKey: ['app-settings', 'app_name'],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_settings' as any)
        .select('value')
        .eq('key', 'app_name')
        .maybeSingle();
      return (data as any)?.value || 'Ahmad Mart';
    },
    staleTime: 300000,
  });

  const appName = appNameSetting || 'Ahmad Mart';

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedInstructions, setSelectedInstructions] = useState<string[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderNumber: string;
    items: typeof items;
    address: Address;
    paymentMethod: PaymentMethod;
    total: number;
    subtotal: number;
    deliveryFee: number;
    platformFee: number;
    smallOrderFee: number;
    gst: number;
    creditUsed: number;
  } | null>(null);
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

  // Auto-select credit if balance covers entire order
  useEffect(() => {
    if (creditBalance > 0 && creditBalance >= total) {
      setPaymentMethod('credit');
    }
  }, [creditBalance]);

  const subtotal = getTotalAmount();
  const fees = feeConfig
    ? computeDeliveryFee(feeConfig, subtotal)
    : { deliveryFee: getDeliveryFee(), platformFee: 5, surgeApplied: false, surgeLabel: '', smallOrderFee: 0 };
  const deliveryFee = fees.deliveryFee;
  const platformFee = fees.platformFee;
  const smallOrderFee = fees.smallOrderFee;
  const gst = platformFee * 0.18;
  const total = subtotal + deliveryFee + platformFee + smallOrderFee + gst;
  const totalSavings = items.reduce((acc, item) => acc + ((item.mrp - item.selling_price) * item.quantity), 0);

  const creditCoversAll = paymentMethod === 'credit' && creditBalance >= total;
  const amountToPay = paymentMethod === 'credit' ? Math.max(0, total - creditBalance) : total;

  const toggleInstruction = (id: string) => {
    setSelectedInstructions(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const customerNotesFromInstructions = selectedInstructions
    .map(id => DELIVERY_INSTRUCTIONS.find(i => i.id === id)?.label)
    .filter(Boolean)
    .join(', ');

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
      const creditUsed = paymentMethod === 'credit' ? Math.min(creditBalance, total) : 0;
      // Snapshot data before cart clears
      const snapshot = {
        items: [...items],
        address: selectedAddress!,
        paymentMethod,
        total,
        subtotal,
        deliveryFee,
        platformFee,
        smallOrderFee,
        gst,
        creditUsed,
      };
      const order = await createOrder.mutateAsync({
        address: selectedAddress,
        paymentMethod,
        customerNotes: customerNotesFromInstructions || undefined,
        creditUsed,
      });
      setOrderSuccess({ orderNumber: order.order_number, ...snapshot });
    } catch (error) {
      console.error('Order failed:', error);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // ─── Order Success Screen ───
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
    <div className="min-h-screen bg-muted/40 text-foreground font-sans">

      {/* ─── Sticky Header ─── */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="hover:bg-primary-foreground/10 rounded-full p-1.5 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold flex-1">Checkout</h1>
          <div className="hidden md:flex items-center gap-1 text-xs opacity-80">
            <Shield className="w-4 h-4" />
            <span>100% Secure</span>
          </div>
        </div>
      </header>

      {/* ─── Progress Stepper ─── */}
      <div className="bg-card border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-3">
          <div className="flex items-center justify-center gap-2 text-xs">
            {/* Step 1: Cart - done */}
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                <Check className="w-3 h-3" />
              </span>
              <span className="font-medium text-primary">Cart</span>
            </div>
            <div className="w-8 h-px bg-primary" />
            {/* Step 2: Checkout - active */}
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">2</span>
              <span className="font-semibold text-primary">Checkout</span>
            </div>
            <div className="w-8 h-px bg-border" />
            {/* Step 3: Order Placed - pending */}
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold">3</span>
              <span className="text-muted-foreground">Order Placed</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-4 pb-44 lg:pb-6">
        <div className="flex flex-col lg:flex-row gap-4">

          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* ── Delivery Address Card ── */}
            <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border">
              <div className="p-4">
                {selectedAddress ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm">{profile?.full_name || 'User'}</span>
                            <span className="text-[10px] font-semibold uppercase bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                              {selectedAddress.address_type}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            {selectedAddress.address_line1}
                            {selectedAddress.address_line2 && `, ${selectedAddress.address_line2}`}
                            {selectedAddress.landmark && `, ${selectedAddress.landmark}`}
                            {`, ${selectedAddress.city}`} - {selectedAddress.pincode}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 text-xs h-8"
                        onClick={() => setShowAddressList(!showAddressList)}
                      >
                        Change
                      </Button>
                    </div>
                    <div className="mt-3 flex items-center gap-2 bg-primary/5 rounded-lg px-3 py-2">
                      <Clock className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-primary">Standard Delivery</p>
                        <p className="text-[11px] text-muted-foreground">Arriving in 15-20 mins</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">No address selected</p>
                    <Button size="sm" onClick={() => setShowAddressForm(true)}>
                      <Plus className="w-4 h-4 mr-1" /> Add Address
                    </Button>
                  </div>
                )}

                {/* Address List Dropdown */}
                <AnimatePresence>
                  {showAddressList && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3"
                    >
                      <Separator className="mb-3" />
                      <div className="flex justify-between items-center mb-2">
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
                        <div className="space-y-2 max-h-[240px] overflow-y-auto">
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

            {/* ── Delivery Instructions Chips ── */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-4">
              <h3 className="text-sm font-semibold mb-3">Delivery Instructions</h3>
              <div className="flex flex-wrap gap-2">
                {DELIVERY_INSTRUCTIONS.map(inst => {
                  const Icon = inst.icon;
                  const isSelected = selectedInstructions.includes(inst.id);
                  return (
                    <button
                      key={inst.id}
                      onClick={() => toggleInstruction(inst.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-medium transition-colors",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {inst.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Order Summary ── */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold">Order Summary</h3>
                <button
                  onClick={() => navigate('/cart')}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Edit Cart
                </button>
              </div>
              <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto hide-scrollbar">
                {items.map(item => (
                  <div key={item.product_id} className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg border border-border bg-muted/30 overflow-hidden shrink-0">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      {item.vendor_name && (
                        <p className="text-[11px] text-muted-foreground">Sold by <span className="font-medium">{item.vendor_name}</span></p>
                      )}
                      {item.unit_value && item.unit_type && (
                        <p className="text-[11px] text-muted-foreground">({item.unit_value}{item.unit_type})</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-muted-foreground">x {item.quantity}</span>
                      <p className="text-sm font-semibold">₹{(item.selling_price * item.quantity).toFixed(0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Bill Breakdown ── */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-4">
              <h3 className="text-sm font-semibold mb-3">Bill Total</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item Total</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Delivery Fee
                    {fees.surgeApplied && (
                      <span className="ml-1 text-[11px] text-destructive font-medium">({fees.surgeLabel})</span>
                    )}
                  </span>
                  <span className={deliveryFee === 0 ? 'text-primary font-medium' : ''}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Fee</span>
                  <span>₹{platformFee}</span>
                </div>
                {smallOrderFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Small Order Fee</span>
                    <span>₹{smallOrderFee}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST & Charges</span>
                  <span>₹{gst.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Bill Total</span>
                  <span>₹{total.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* ── Payment Method ── */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold">Payment Method</h3>
              </div>
              <div className="p-4 space-y-3">

                {/* Credit Card (only if balance > 0) */}
                {creditBalance > 0 && (
                  <div
                    className={cn(
                      "rounded-xl overflow-hidden cursor-pointer transition-all border-2",
                      paymentMethod === 'credit' ? "border-primary shadow-md" : "border-transparent"
                    )}
                    onClick={() => setPaymentMethod('credit')}
                  >
                    <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium opacity-80">{appName}</span>
                        <CreditCard className="w-5 h-5 opacity-80" />
                      </div>
                      <p className="text-lg font-bold">Available Credit</p>
                      <p className="text-2xl font-bold mt-1">₹{creditBalance.toLocaleString()}</p>
                    </div>
                    {paymentMethod === 'credit' && (
                      <div className="bg-primary/10 px-4 py-2.5 text-xs text-primary font-medium">
                        {creditCoversAll
                          ? `Your ${appName} Credit covers this entire order`
                          : `₹${creditBalance.toLocaleString()} credit applied • ₹${amountToPay.toFixed(0)} remaining via cash`
                        }
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">
                  Choose Payment Method
                </p>

                {/* UPI */}
                <div
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors",
                    paymentMethod === 'upi' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  )}
                  onClick={() => setPaymentMethod('upi')}
                >
                  <div className="w-9 h-9 border border-border rounded-lg flex items-center justify-center bg-muted/30">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold">UPI</h4>
                    <p className="text-[11px] text-muted-foreground">Google Pay, PhonePe, Paytm & more</p>
                  </div>
                  {paymentMethod === 'upi' && <Check className="w-5 h-5 text-primary" />}
                </div>

                {/* Cash on Delivery */}
                <div
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors",
                    paymentMethod === 'cash' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  )}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <div className="w-9 h-9 border border-border rounded-lg flex items-center justify-center bg-muted/30">
                    <Banknote className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold">Cash on Delivery</h4>
                    <p className="text-[11px] text-muted-foreground">Pay when your order arrives</p>
                  </div>
                  {paymentMethod === 'cash' && <Check className="w-5 h-5 text-primary" />}
                </div>
              </div>
            </div>

            {/* ── Savings Badge ── */}
            {totalSavings > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex items-center gap-2.5">
                <Tag className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm text-primary font-semibold">
                  You are saving ₹{totalSavings.toFixed(0)} on this order
                </span>
              </div>
            )}

            {/* ── Policy Sections ── */}
            <div className="space-y-3">
              <div className="bg-card rounded-xl border border-border p-4 flex gap-3">
                <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold mb-0.5">Cancellation Policy</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Orders cannot be cancelled once packed for delivery. Please check items carefully.
                  </p>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 flex gap-3">
                <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold mb-0.5">Safety Information</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Our delivery partners follow strict hygiene protocols including masking and sanitization.
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Place Order */}
            <div className="hidden lg:block">
              <Button
                onClick={handlePlaceOrder}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-14 rounded-xl text-base shadow-lg"
                disabled={isPlacingOrder || !selectedAddress}
              >
                {isPlacingOrder ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                ) : (
                  'Place Order'
                )}
              </Button>
            </div>
          </div>

          {/* ── RIGHT COLUMN (Desktop only) ── */}
          <div className="hidden lg:block w-[380px] shrink-0">
            <div className="lg:sticky lg:top-[70px] space-y-4">

              {/* Quick Summary Card */}
              <div className="bg-card rounded-xl shadow-sm border border-border p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-4">Order Summary</h3>
                <div className="space-y-3 mb-4 max-h-[280px] overflow-y-auto hide-scrollbar">
                  {items.map(item => (
                    <div key={item.product_id} className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg border border-border bg-muted/30 overflow-hidden shrink-0">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">x {item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold shrink-0">₹{(item.selling_price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="space-y-2 text-sm">
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
                  {smallOrderFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Small Order Fee</span>
                      <span>₹{smallOrderFee}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST & Charges</span>
                    <span>₹{gst.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-bold">
                    <span>Total</span>
                    <span>₹{total.toFixed(0)}</span>
                  </div>
                </div>
                {totalSavings > 0 && (
                  <div className="mt-3 bg-primary/5 border border-primary/20 rounded-lg p-2.5 flex items-center gap-2 text-sm">
                    <Tag className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-primary font-semibold text-xs">You save ₹{totalSavings.toFixed(0)}</span>
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="bg-card rounded-xl shadow-sm border border-border p-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Safe & Secure</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  <span>Fresh Quality</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile Sticky Bottom Bar ─── */}
      <div className="lg:hidden fixed bottom-[60px] left-0 right-0 bg-card border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-40">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-lg font-bold">
              ₹{amountToPay.toFixed(0)} to pay{creditCoversAll ? '' : ''}
            </span>
            {creditCoversAll && (
              <span className="text-[11px] text-primary font-medium">
                Paid via {appName} Credit
              </span>
            )}
            {paymentMethod !== 'credit' && (
              <span className="text-[11px] text-muted-foreground capitalize">
                via {paymentMethod === 'upi' ? 'UPI' : 'Cash on Delivery'}
              </span>
            )}
            {paymentMethod === 'credit' && !creditCoversAll && (
              <span className="text-[11px] text-muted-foreground">
                ₹{Math.min(creditBalance, total).toFixed(0)} credit + ₹{amountToPay.toFixed(0)} cash
              </span>
            )}
          </div>
          <Button
            onClick={handlePlaceOrder}
            className="flex-1 max-w-[200px] bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-xl text-base"
            disabled={isPlacingOrder || !selectedAddress}
          >
            {isPlacingOrder ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Placing...</>
            ) : (
              'Place Order'
            )}
          </Button>
        </div>
      </div>

      {/* Bottom Navigation (mobile) */}
      <BottomNavigation />

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
