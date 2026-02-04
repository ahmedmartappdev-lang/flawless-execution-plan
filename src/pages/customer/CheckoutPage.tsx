import React, { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AddressCard } from '@/components/customer/AddressCard';
import { AddressForm } from '@/components/customer/AddressForm';
import { useAddresses, Address, AddressInput } from '@/hooks/useAddresses';
import { useOrders } from '@/hooks/useOrders';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

type PaymentMethod = 'cash' | 'upi' | 'card';

const paymentMethods = [
  { value: 'cash' as const, label: 'Cash on Delivery', icon: Banknote, description: 'Pay when you receive' },
  { value: 'upi' as const, label: 'UPI', icon: Smartphone, description: 'GPay, PhonePe, Paytm', disabled: true },
  { value: 'card' as const, label: 'Card', icon: CreditCard, description: 'Credit/Debit card', disabled: true },
];

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { items, getTotalAmount, getDeliveryFee, getTotalItems } = useCartStore();
  const { addresses, defaultAddress, isLoading: addressesLoading, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAddresses();
  const { createOrder } = useOrders();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerNotes, setCustomerNotes] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: string } | null>(null);

  // Set default address when loaded
  React.useEffect(() => {
    if (defaultAddress && !selectedAddress) {
      setSelectedAddress(defaultAddress);
    }
  }, [defaultAddress, selectedAddress]);

  // Redirect if not authenticated or cart empty
  React.useEffect(() => {
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
    if (!selectedAddress) return;
    
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
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Order Success Screen
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
    <div className="min-h-screen bg-muted pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cart')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Checkout</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Delivery Address */}
        <section className="bg-background rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Delivery Address</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingAddress(null);
                setShowAddressForm(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {addressesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No saved addresses</p>
              <Button onClick={() => setShowAddressForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  isSelected={selectedAddress?.id === address.id}
                  onSelect={() => setSelectedAddress(address)}
                  onEdit={() => {
                    setEditingAddress(address);
                    setShowAddressForm(true);
                  }}
                  onDelete={() => deleteAddress.mutate(address.id)}
                  onSetDefault={() => setDefaultAddress.mutate(address.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Payment Method */}
        <section className="bg-background rounded-xl border border-border p-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Payment Method
          </h2>

          <RadioGroup
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            className="space-y-3"
          >
            {paymentMethods.map((method) => (
              <div
                key={method.value}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer',
                  paymentMethod === method.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border',
                  method.disabled && 'opacity-50 cursor-not-allowed'
                )}
                onClick={() => !method.disabled && setPaymentMethod(method.value)}
              >
                <RadioGroupItem
                  value={method.value}
                  id={method.value}
                  disabled={method.disabled}
                />
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <method.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <Label htmlFor={method.value} className="font-medium cursor-pointer">
                    {method.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{method.description}</p>
                </div>
                {method.disabled && (
                  <span className="text-xs bg-muted px-2 py-1 rounded">Coming soon</span>
                )}
              </div>
            ))}
          </RadioGroup>
        </section>

        {/* Order Notes */}
        <section className="bg-background rounded-xl border border-border p-4">
          <h2 className="font-semibold mb-3">Order Notes (Optional)</h2>
          <Textarea
            placeholder="Any special instructions for delivery..."
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            rows={2}
          />
        </section>

        {/* Order Summary */}
        <section className="bg-background rounded-xl border border-border p-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Order Summary
          </h2>
          
          <div className="space-y-2 mb-4">
            {items.slice(0, 3).map((item) => (
              <div key={item.product_id} className="flex items-center gap-3">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-10 h-10 rounded-lg object-cover bg-muted"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ₹{item.selling_price} × {item.quantity}
                  </p>
                </div>
                <span className="font-medium">₹{(item.selling_price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
            {items.length > 3 && (
              <p className="text-sm text-muted-foreground">
                +{items.length - 3} more items
              </p>
            )}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Item Total ({getTotalItems()} items)</span>
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
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </section>
      </main>

      {/* Place Order Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
        <Button
          onClick={handlePlaceOrder}
          className="w-full"
          size="lg"
          disabled={!selectedAddress || isPlacingOrder || items.length === 0}
        >
          {isPlacingOrder ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Placing Order...
            </>
          ) : (
            <>
              Place Order • ₹{total.toFixed(2)}
            </>
          )}
        </Button>
        {!selectedAddress && addresses.length > 0 && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            Please select a delivery address
          </p>
        )}
      </div>

      {/* Address Form Dialog */}
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
