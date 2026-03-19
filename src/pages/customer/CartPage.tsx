import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Clock, ShieldCheck } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useTrendingProducts } from '@/hooks/useProducts';
import { useAuthStore } from '@/stores/authStore';
import { useAddresses } from '@/hooks/useAddresses';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    items, 
    incrementQuantity, 
    decrementQuantity, 
    getTotalAmount, 
    getDeliveryFee,
    addItem,
  } = useCartStore();

  const { data: upsellProducts } = useTrendingProducts();
  const { addresses } = useAddresses();
  const [noBag, setNoBag] = useState(false);

  // Exclude out of stock items from local calculations
  const activeItemCount = items.filter(item => !(item.stock_quantity !== undefined && item.stock_quantity <= 0)).length;
  const itemTotal = getTotalAmount();
  const deliveryFee = getDeliveryFee();
  
  // Handling & GST should only apply if there are valid items in the cart
  const handlingFee = itemTotal > 0 ? 5.00 : 0;
  const gst = itemTotal > 0 ? handlingFee * 0.18 : 0;
  const grandTotal = itemTotal + deliveryFee + handlingFee + gst;
  
  const totalSavings = items.reduce((acc, item) => {
    const isOutOfStock = item.stock_quantity !== undefined && item.stock_quantity <= 0;
    return isOutOfStock ? acc : acc + ((item.mrp - item.selling_price) * item.quantity);
  }, 0);

  const handleUpsellAdd = (product: any) => {
    if (product.stock_quantity !== undefined && product.stock_quantity <= 0) {
      toast.error('This product is out of stock');
      return;
    }
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

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-background p-4 sticky top-0 z-50 border-b flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4"><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="text-lg font-bold">Your Cart</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          {/* Cart illustration */}
          <div className="w-32 h-32 mb-6 text-muted-foreground/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Your cart is empty</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-[260px]">Looks like you haven't added anything to your cart yet. Start exploring!</p>
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-10 rounded-xl text-sm"
            onClick={() => navigate('/')}
          >
            Start Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* HEADER */}
      <header className="bg-background px-5 py-4 flex items-center justify-between sticky top-0 z-50 border-b">
        <div className="flex items-center gap-4 text-lg font-extrabold cursor-pointer" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" /> Your Cart
        </div>
      </header>

      {/* TWO-COLUMN LAYOUT */}
      <div className="max-w-[1200px] mx-auto p-4 lg:p-6 flex flex-col lg:flex-row gap-5 pb-[180px] lg:pb-6">

        {/* LEFT COLUMN — Cart Items */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Address prompt */}
          <section className="bg-background rounded-lg border p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">From Saved Addresses</span>
            <button
              className="text-sm font-semibold text-primary border border-primary rounded-lg px-4 py-1.5 hover:bg-primary/5 transition-colors"
              onClick={() => navigate('/addresses')}
            >
              {addresses && addresses.length > 0 ? 'Change Address' : 'Add Address'}
            </button>
          </section>

          {/* Items */}
          <section className="bg-background rounded-lg border">
            <div className="flex justify-between items-center p-5 border-b">
              <div className="flex items-center gap-2 font-extrabold text-lg">
                <Clock className="w-5 h-5 text-primary" />
                15 Mins <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded uppercase font-bold">Superfast</span>
              </div>
              <span className="text-xs text-muted-foreground">{activeItemCount} active item{activeItemCount !== 1 ? 's' : ''}</span>
            </div>

            {items.map((item) => {
              const isItemOutOfStock = item.stock_quantity !== undefined && item.stock_quantity <= 0;
              return (
                <div key={item.id} className={`flex items-start gap-4 p-5 border-b last:border-0 ${isItemOutOfStock ? 'opacity-50' : ''}`}>
                  <div className="relative shrink-0">
                    <img src={item.image_url} alt={item.name} className="w-[90px] h-[90px] object-contain rounded-lg bg-muted/30 p-1" />
                    {isItemOutOfStock && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
                        <span className="bg-destructive text-destructive-foreground px-2 py-0.5 rounded text-[10px] font-bold uppercase">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm mb-0.5 line-clamp-2 leading-snug">{item.name}</div>
                    {item.vendor_name && (
                      <div className="text-[11px] text-muted-foreground mb-0.5">Sold by <span className="font-medium">{item.vendor_name}</span></div>
                    )}
                    <div className="text-xs text-muted-foreground mb-2">{item.unit_value} {item.unit_type}</div>
                    {isItemOutOfStock ? (
                      <span className="text-xs font-bold text-destructive">Currently unavailable</span>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        {item.mrp > item.selling_price && (
                          <span className="line-through text-muted-foreground text-xs">₹{item.mrp}</span>
                        )}
                        <span className="font-extrabold">₹{item.selling_price}</span>
                        {item.mrp > item.selling_price && (
                          <span className="text-xs font-semibold text-primary">{Math.round(((item.mrp - item.selling_price) / item.mrp) * 100)}% Off</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center border border-border rounded-lg overflow-hidden h-9">
                      <button className="px-3 text-foreground font-semibold hover:bg-primary hover:text-primary-foreground h-full transition-colors" onClick={() => decrementQuantity(item.id)}>
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-foreground font-semibold text-sm">{item.quantity}</span>
                      <button className="px-3 text-foreground font-semibold hover:bg-primary hover:text-primary-foreground h-full transition-colors" onClick={() => incrementQuantity(item.id)} disabled={isItemOutOfStock}>
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-extrabold text-sm">
                      {isItemOutOfStock ? '₹0' : `₹${(item.selling_price * item.quantity).toFixed(0)}`}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Place Order button inside left column on desktop */}
            <div className="hidden lg:flex p-5 border-t justify-end">
              <Button
                className={`bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base px-12 py-6 rounded-lg shadow-md uppercase tracking-wide ${itemTotal === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleCheckout}
                disabled={itemTotal === 0}
              >
                Place Order
              </Button>
            </div>
          </section>

          {/* Upsell */}
          {upsellProducts && upsellProducts.length > 0 && (
            <section className="bg-background rounded-lg border p-5">
              <h3 className="text-sm font-bold mb-4 border-b pb-2">You might also like</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {upsellProducts.slice(0, 6).map((product) => {
                  const isOOS = product.stock_quantity !== undefined && product.stock_quantity <= 0;
                  return (
                    <div key={product.id} className={`min-w-[120px] w-[120px] shrink-0 relative ${isOOS ? 'opacity-50' : ''}`}>
                      {isOOS ? (
                        <div className="absolute top-0 right-0 bg-muted text-muted-foreground rounded w-[22px] h-[22px] flex items-center justify-center z-10 cursor-not-allowed">
                          <Plus className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <button
                          className="absolute top-0 right-0 bg-transparent border border-border text-foreground rounded w-[22px] h-[22px] flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors z-10"
                          onClick={() => handleUpsellAdd(product)}
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                        </button>
                      )}
                      <img src={product.primary_image_url || '/placeholder.svg'} alt={product.name} className="w-full h-[100px] object-contain mb-2 bg-muted/30 rounded-lg p-1" />
                      <div className="text-[11px] font-semibold leading-tight h-[2.4em] overflow-hidden mb-1 line-clamp-2">{product.name}</div>
                      {isOOS ? (
                        <div className="text-[10px] font-bold text-destructive uppercase">Out of Stock</div>
                      ) : (
                        <div className="text-xs font-extrabold flex items-center gap-1">
                          ₹{product.selling_price}
                          {product.mrp > product.selling_price && (
                            <span className="text-muted-foreground font-normal line-through text-[10px]">₹{product.mrp}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Bag toggle */}
          <section className="bg-background rounded-lg border p-4 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold mb-0.5">I don't need a bag! 🌱</h4>
              <p className="text-xs text-muted-foreground">Take the pledge for a greener future</p>
            </div>
            <div
              className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${noBag ? 'bg-primary' : 'bg-muted'}`}
              onClick={() => setNoBag(!noBag)}
            >
              <div className={`bg-background w-4 h-4 rounded-full absolute top-0.5 border transition-all shadow-sm ${noBag ? 'left-[22px]' : 'left-[2px]'}`} />
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN — Sticky Price Details */}
        <div className="hidden lg:block w-[380px] shrink-0">
          <div className="sticky top-[80px] space-y-4">
            <section className="bg-background rounded-lg border">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest p-5 pb-3 border-b">Price Details</h3>
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Price ({activeItemCount} item{activeItemCount !== 1 ? 's' : ''})</span>
                  <span>₹{(itemTotal + totalSavings).toFixed(0)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Discount</span>
                    <span>− ₹{totalSavings.toFixed(0)}</span>
                  </div>
                )}
                {itemTotal > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span>Handling Fee</span>
                      <span>₹{handlingFee.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      {deliveryFee === 0 ? <span className="text-primary font-bold">FREE</span> : <span>₹{deliveryFee.toFixed(0)}</span>}
                    </div>
                    <div className="flex justify-between">
                      <span>GST & Charges</span>
                      <span>₹{gst.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-extrabold text-base pt-3 mt-1 border-t">
                  <span>Total Amount</span>
                  <span>₹{grandTotal.toFixed(0)}</span>
                </div>
                {totalSavings > 0 && (
                  <p className="text-primary font-semibold text-sm pt-1">You will save ₹{totalSavings.toFixed(0)} on this order</p>
                )}
              </div>
            </section>

            <div className="flex items-start gap-2 text-xs text-muted-foreground px-1">
              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/60" />
              <span>Safe and Secure Payments. Easy returns. 100% Authentic products.</span>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY FOOTER */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-[200]">
        <div className="px-5 pt-3 pb-1 space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Item Total</span><span>₹{itemTotal.toFixed(0)}</span>
          </div>
          {totalSavings > 0 && (
            <div className="flex justify-between text-xs text-primary font-semibold">
              <span>Savings</span><span>− ₹{totalSavings.toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between font-extrabold text-base pt-1 border-t">
            <span>To Pay</span>
            <span>₹{grandTotal.toFixed(0)}</span>
          </div>
        </div>
        <div className="px-5 pb-4 pt-2">
          <Button
            className={`w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base py-6 rounded-lg uppercase tracking-wide ${itemTotal === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleCheckout}
            disabled={itemTotal === 0}
          >
            Place Order
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
