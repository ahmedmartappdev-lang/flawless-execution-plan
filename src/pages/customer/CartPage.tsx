import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, ChevronRight, Clock, ShieldCheck } from 'lucide-react';
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

  const itemTotal = getTotalAmount();
  const deliveryFee = getDeliveryFee();
  const handlingFee = 5.00;
  const gst = handlingFee * 0.18;
  const grandTotal = itemTotal + deliveryFee + handlingFee + gst;
  const totalSavings = items.reduce((acc, item) => acc + ((item.mrp - item.selling_price) * item.quantity), 0);

  const handleUpsellAdd = (product: any) => {
    addItem({
      id: product.id,
      product_id: product.id,
      name: product.name,
      image_url: product.primary_image_url || '/placeholder.svg',
      unit_value: product.unit_value || 1,
      unit_type: product.unit_type,
      selling_price: product.selling_price,
      mrp: product.mrp,
      max_quantity: product.max_order_quantity || 10,
      vendor_id: product.vendor_id,
    });
    toast.success('Added to cart');
  };

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please login to continue');
      navigate('/auth');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-muted/40 flex flex-col">
        <header className="bg-background p-4 sticky top-0 z-50 border-b flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4"><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="text-lg font-bold">Your Cart</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mb-4 shadow-sm">
            <Clock className="w-12 h-12 text-muted-foreground/40" />
          </div>
          <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">Add items to start a cart</p>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-xl" onClick={() => navigate('/')}>
            Start Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 font-sans">
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
              <span className="text-xs text-muted-foreground">{items.length} item{items.length > 1 ? 's' : ''}</span>
            </div>

            {items.map((item) => (
              <div key={item.product_id} className="flex items-start gap-4 p-5 border-b last:border-0">
                <img src={item.image_url} alt={item.name} className="w-[90px] h-[90px] object-contain rounded-lg bg-muted/30 p-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm mb-1 line-clamp-2 leading-snug">{item.name}</div>
                  <div className="text-xs text-muted-foreground mb-2">{item.unit_value} {item.unit_type}</div>
                  <div className="flex items-center gap-2 text-sm">
                    {item.mrp > item.selling_price && (
                      <span className="line-through text-muted-foreground text-xs">₹{item.mrp}</span>
                    )}
                    <span className="font-extrabold">₹{item.selling_price}</span>
                    {item.mrp > item.selling_price && (
                      <span className="text-xs font-semibold text-green-600">{Math.round(((item.mrp - item.selling_price) / item.mrp) * 100)}% Off</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center border border-primary bg-primary/5 rounded-lg overflow-hidden h-9">
                    <button className="px-3 text-primary font-bold hover:bg-primary/10 h-full" onClick={() => decrementQuantity(item.product_id)}>
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-primary font-extrabold text-sm">{item.quantity}</span>
                    <button className="px-3 text-primary font-bold hover:bg-primary/10 h-full" onClick={() => incrementQuantity(item.product_id)}>
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="font-extrabold text-sm">₹{(item.selling_price * item.quantity).toFixed(0)}</span>
                </div>
              </div>
            ))}

            {/* Place Order button inside left column on desktop (Flipkart style) */}
            <div className="hidden lg:flex p-5 border-t justify-end">
              <Button
                className="bg-[#FB641B] hover:bg-[#e85a15] text-white font-extrabold text-base px-12 py-6 rounded-sm shadow-md uppercase tracking-wide"
                onClick={handleCheckout}
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
                {upsellProducts.slice(0, 6).map((product) => (
                  <div key={product.id} className="min-w-[120px] w-[120px] shrink-0 relative">
                    <button
                      className="absolute top-0 right-0 bg-background border border-primary text-primary rounded w-[22px] h-[22px] flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors z-10"
                      onClick={() => handleUpsellAdd(product)}
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                    </button>
                    <img src={product.primary_image_url || '/placeholder.svg'} alt={product.name} className="w-full h-[100px] object-contain mb-2 bg-muted/30 rounded-lg p-1" />
                    <div className="text-[11px] font-semibold leading-tight h-[2.4em] overflow-hidden mb-1 line-clamp-2">{product.name}</div>
                    <div className="text-xs font-extrabold flex items-center gap-1">
                      ₹{product.selling_price}
                      {product.mrp > product.selling_price && (
                        <span className="text-muted-foreground font-normal line-through text-[10px]">₹{product.mrp}</span>
                      )}
                    </div>
                  </div>
                ))}
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
                  <span>Price ({items.length} item{items.length > 1 ? 's' : ''})</span>
                  <span>₹{(itemTotal + totalSavings).toFixed(0)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>− ₹{totalSavings.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Handling Fee</span>
                  <span>₹{handlingFee.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  {deliveryFee === 0 ? <span className="text-green-600 font-bold">FREE</span> : <span>₹{deliveryFee.toFixed(0)}</span>}
                </div>
                <div className="flex justify-between">
                  <span>GST & Charges</span>
                  <span>₹{gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-base pt-3 mt-1 border-t">
                  <span>Total Amount</span>
                  <span>₹{grandTotal.toFixed(0)}</span>
                </div>
                {totalSavings > 0 && (
                  <p className="text-green-600 font-semibold text-sm pt-1">You will save ₹{totalSavings.toFixed(0)} on this order</p>
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
        {/* Bill summary row */}
        <div className="px-5 pt-3 pb-1 space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Item Total</span><span>₹{itemTotal.toFixed(0)}</span>
          </div>
          {totalSavings > 0 && (
            <div className="flex justify-between text-xs text-green-600 font-semibold">
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
            className="w-full bg-[#FB641B] hover:bg-[#e85a15] text-white font-extrabold text-base py-6 rounded-sm uppercase tracking-wide"
            onClick={handleCheckout}
          >
            Place Order
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
