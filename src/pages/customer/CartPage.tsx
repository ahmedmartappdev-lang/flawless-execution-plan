import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Clock, MapPin, CreditCard, TrendingUp, Trash2, CheckCircle, ShieldCheck, Info } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useTrendingProducts } from '@/hooks/useProducts';
import { useAuthStore } from '@/stores/authStore';
import { useAddresses } from '@/hooks/useAddresses';
import { useCustomerCredits } from '@/hooks/useCustomerCredits';
import { useDeliveryFeeConfig, computeDeliveryFee } from '@/hooks/useDeliveryFeeConfig';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import CustomerLayout from '@/components/layouts/CustomerLayout';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    items,
    incrementQuantity,
    decrementQuantity,
    removeItem,
    clearCart,
    getTotalAmount,
    addItem,
  } = useCartStore();

  const { data: upsellProducts } = useTrendingProducts();
  const { defaultAddress } = useAddresses();
  const { creditBalance } = useCustomerCredits();
  const { data: feeConfig } = useDeliveryFeeConfig();

  const [useCreditCard, setUseCreditCard] = useState(true);

  // Active items (exclude out of stock)
  const activeItems = useMemo(() => items.filter(i => !(i.stock_quantity !== undefined && i.stock_quantity <= 0)), [items]);

  const itemTotal = getTotalAmount();

  // Fee calculation from backend config
  const fees = useMemo(() => {
    if (!feeConfig) return { deliveryFee: 0, platformFee: 0, surgeApplied: false, surgeLabel: '', smallOrderFee: 0 };
    return computeDeliveryFee(feeConfig, itemTotal);
  }, [feeConfig, itemTotal]);

  // Savings = sum of (mrp - selling_price) * qty for active items
  const totalSavings = useMemo(() =>
    activeItems.reduce((acc, item) => acc + ((item.mrp - item.selling_price) * item.quantity), 0),
    [activeItems]
  );

  const grandTotal = itemTotal + fees.deliveryFee + fees.platformFee + fees.smallOrderFee;
  const creditApplied = useCreditCard ? Math.min(creditBalance, grandTotal) : 0;
  const toPay = Math.max(0, grandTotal - creditApplied);

  // Group items by vendor
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof items> = {};
    items.forEach(item => {
      const key = item.vendor_id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [items]);

  const handleUpsellAdd = (product: any) => {
    addItem({
      id: product.id,
      product_id: product.id,
      name: product.name,
      image_url: product.primary_image_url || '/placeholder.svg',
      unit_value: product.unit_value || 1,
      unit_type: product.unit_type,
      selling_price: product.admin_selling_price ?? product.selling_price,
      mrp: product.mrp,
      max_quantity: product.max_order_quantity || 10,
      vendor_id: product.vendor_id,
      vendor_name: product.vendor?.business_name || undefined,
      stock_quantity: product.stock_quantity,
    });
    toast.success('Added to cart');
  };

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please login to continue');
      navigate('/auth');
      return;
    }
    if (itemTotal === 0) {
      toast.error('Your cart has no available items to checkout.');
      return;
    }
    navigate('/checkout');
  };

  const handleClearCart = () => {
    clearCart();
    toast.success('Cart cleared');
  };

  // Empty cart
  if (items.length === 0) {
    return (
      <CustomerLayout hideHeader hideBottomNav={false}>
        <div className="min-h-[70vh] flex flex-col">
          <header className="bg-background px-4 h-14 flex items-center gap-3 sticky top-0 z-50 border-b">
            <button onClick={() => navigate(-1)} className="p-1">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-[17px] font-bold">My Cart</h1>
          </header>
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Clock className="w-12 h-12 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Add items to start a cart</p>
            <Button className="font-bold py-3 px-8 rounded-xl" onClick={() => navigate('/')}>
              Start Shopping
            </Button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 pb-48">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-background border-b px-4 h-14 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button className="p-1" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-[17px] font-bold">My Cart</h1>
        </div>
        <button className="text-destructive text-sm font-medium" onClick={handleClearCart}>Clear All</button>
      </header>

      {/* DELIVERY ADDRESS STRIP */}
      <section className="bg-background px-4 py-3 flex items-start gap-3 border-b">
        <div className="mt-1">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Delivering to</p>
          <p className="text-sm font-semibold truncate">
            {defaultAddress
              ? `${defaultAddress.address_line1}, ${defaultAddress.city}`
              : 'No address selected'}
          </p>
        </div>
        <button
          className="text-primary text-xs font-bold uppercase pt-3"
          onClick={() => navigate('/addresses')}
        >
          Change
        </button>
      </section>

      <main className="p-4 space-y-4">
        {/* ESTIMATED DELIVERY CHIP */}
        <div className="flex justify-center">
          <div className="border border-primary/30 bg-primary/5 rounded-full px-4 py-1.5 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">Estimated Delivery: 30–45 mins</span>
          </div>
        </div>

        {/* CART ITEMS GROUPED BY VENDOR */}
        <div className="space-y-3">
          {Object.entries(groupedItems).map(([vendorId, vendorItems]) => {
            const vendorName = vendorItems[0]?.vendor_name;
            const hasMultipleVendors = Object.keys(groupedItems).length > 1;

            return (
              <div key={vendorId} className="bg-background rounded-xl overflow-hidden shadow-sm border">
                {/* Vendor header — only show if multiple vendors or vendor name exists */}
                {(hasMultipleVendors || vendorName) && vendorName && (
                  <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{vendorName}</span>
                  </div>
                )}

                {vendorItems.map((item) => {
                  const isOutOfStock = item.stock_quantity !== undefined && item.stock_quantity <= 0;
                  const saving = (item.mrp - item.selling_price) * item.quantity;

                  return (
                    <article key={item.id} className={`p-4 flex gap-4 border-b last:border-b-0 ${isOutOfStock ? 'opacity-50' : ''}`}>
                      {/* Image */}
                      <div className="w-[72px] h-[72px] bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          alt={item.name}
                          className="w-full h-full object-cover"
                          src={item.image_url}
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-lg">
                            <span className="bg-destructive text-destructive-foreground px-2 py-0.5 rounded text-[10px] font-bold">Out of Stock</span>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate">{item.name}</h3>
                        <p className="text-xs text-muted-foreground mb-1">{item.unit_value} {item.unit_type}</p>
                        <div className="flex items-center gap-2 mb-2">
                          {item.mrp > item.selling_price && (
                            <span className="text-xs text-muted-foreground line-through">₹{item.mrp}</span>
                          )}
                          <span className="text-sm font-bold text-primary">
                            {isOutOfStock ? '₹0' : `₹${item.selling_price}`}
                          </span>
                          {!isOutOfStock && saving > 0 && (
                            <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded font-bold">
                              Saving ₹{saving}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center border border-primary/40 rounded-full h-8 px-1 bg-background">
                          <button
                            className="w-6 h-6 flex items-center justify-center text-primary"
                            onClick={() => item.quantity <= 1 ? removeItem(item.id) : decrementQuantity(item.id)}
                          >
                            {item.quantity <= 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-4 w-4" />}
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-primary">{item.quantity}</span>
                          <button
                            className="w-6 h-6 flex items-center justify-center text-primary"
                            onClick={() => incrementQuantity(item.id)}
                            disabled={isOutOfStock}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* AHMAD CREDIT CARD SECTION */}
        {creditBalance !== 0 && (
          <section className="bg-background rounded-xl overflow-hidden shadow-sm border-l-4 border-l-primary flex flex-col">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Ahmad Credit Card {creditBalance > 0 ? 'Active' : ''}</h4>
                  <p className="text-xs text-muted-foreground">
                    {creditBalance > 0
                      ? `Available Credit: ₹${creditBalance.toLocaleString()}`
                      : `Due Amount: ₹${Math.abs(creditBalance).toLocaleString()}`}
                  </p>
                </div>
              </div>
              {creditBalance > 0 && (
                <Switch
                  checked={useCreditCard}
                  onCheckedChange={setUseCreditCard}
                />
              )}
            </div>
            {useCreditCard && creditBalance > 0 && (
              <div className="bg-primary/10 px-4 py-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-[11px] font-bold text-primary uppercase">
                  {creditApplied >= grandTotal
                    ? 'Ahmad Credit Card applied. Pay at month end.'
                    : `₹${creditApplied.toLocaleString()} credit applied. Remaining ₹${toPay.toLocaleString()} to pay.`}
                </span>
              </div>
            )}
          </section>
        )}

        {/* BILL DETAILS */}
        <section className="bg-background rounded-xl p-4 space-y-3 shadow-sm border">
          <h4 className="text-sm font-bold border-b pb-2">Bill Details</h4>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Item Total</span>
            <span>₹{(itemTotal + totalSavings).toLocaleString()}</span>
          </div>
          {totalSavings > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-primary">-₹{totalSavings.toLocaleString()}</span>
            </div>
          )}
          {itemTotal > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                {fees.deliveryFee === 0
                  ? <span className="text-primary font-semibold">FREE</span>
                  : <span>₹{fees.deliveryFee}</span>}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform Fee</span>
                <span>₹{fees.platformFee}</span>
              </div>
              {fees.smallOrderFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Small Order Fee</span>
                  <span>₹{fees.smallOrderFee}</span>
                </div>
              )}
            </>
          )}
          {totalSavings > 0 && (
            <div className="flex justify-between pt-2 border-t">
              <span className="text-primary font-semibold">Total Savings</span>
              <span className="text-primary font-semibold">₹{totalSavings.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2">
            <div className="flex flex-col">
              <span className="text-base font-bold">To Pay: ₹{toPay.toLocaleString()}</span>
            </div>
            {useCreditCard && creditApplied >= grandTotal && grandTotal > 0 && (
              <span className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-full font-bold uppercase">Covered!</span>
            )}
          </div>
        </section>

        {/* SAVINGS BANNER */}
        {totalSavings > 0 && (
          <div className="bg-primary/10 border border-primary/10 rounded-lg p-3 flex items-center justify-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary">You are saving ₹{totalSavings.toLocaleString()} on this order</span>
          </div>
        )}

        {/* UPSELL SECTION */}
        {upsellProducts && upsellProducts.length > 0 && (
          <section className="space-y-3">
            <h4 className="text-sm font-bold px-1">You might also need</h4>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              {upsellProducts.slice(0, 6).map((product) => (
                <div key={product.id} className="flex-shrink-0 w-32 bg-background rounded-xl p-2 border shadow-sm">
                  <img
                    alt={product.name}
                    className="w-20 h-20 mx-auto mb-2 object-contain"
                    src={product.primary_image_url || '/placeholder.svg'}
                  />
                  <p className="text-[11px] font-semibold truncate">{product.name}</p>
                  <p className="text-[10px] text-muted-foreground">₹{product.admin_selling_price ?? product.selling_price}</p>
                  <button
                    className="mt-2 w-full py-1 text-xs font-bold text-primary border border-primary rounded-md hover:bg-primary/5 transition-colors"
                    onClick={() => handleUpsellAdd(product)}
                  >
                    ADD
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* FIXED BOTTOM BAR (above bottom nav) */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex items-center justify-between z-40">
        <div>
          <p className="text-lg font-bold">
            ₹{toPay.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">to pay now</span>
          </p>
          {useCreditCard && creditApplied > 0 && (
            <p className="text-[10px] text-primary font-bold uppercase">Ahmad Credit Used</p>
          )}
        </div>
        <button
          className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-bold text-base shadow-lg active:scale-95 transition-transform disabled:opacity-50"
          onClick={handleCheckout}
          disabled={itemTotal === 0}
        >
          Place Order
        </button>
      </div>

      {/* BOTTOM NAVIGATION */}
      <div className="h-16" /> {/* spacer for bottom nav */}
    </div>
  );
};

export default CartPage;
