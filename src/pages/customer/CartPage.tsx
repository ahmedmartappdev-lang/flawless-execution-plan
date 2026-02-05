import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, ChevronRight, Clock } from 'lucide-react';
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
    updateQuantity, 
    incrementQuantity, 
    decrementQuantity, 
    getTotalAmount, 
    getDeliveryFee,
    addItem,
    getItemQuantity 
  } = useCartStore();

  // Fetch trending products for Upsell section
  const { data: upsellProducts } = useTrendingProducts();
  
  // Fetch addresses to determine footer state
  const { addresses } = useAddresses();

  const [noBag, setNoBag] = useState(false);

  // Calculations
  const itemTotal = getTotalAmount();
  const deliveryFee = getDeliveryFee();
  const handlingFee = 5.00; // Platform fee
  const gst = handlingFee * 0.18; // 18% GST on handling fee
  const grandTotal = itemTotal + deliveryFee + handlingFee + gst;
  
  // Calculate Savings (MRP - Selling Price)
  const totalSavings = items.reduce((acc, item) => {
    return acc + ((item.mrp - item.selling_price) * item.quantity);
  }, 0);

  // Constants for styling to match design
  const colors = {
    yellow: '#F8CB46',
    green: '#0C831F',
    bg: '#F5F7F9',
    textDark: '#1F1F1F',
    textGray: '#666',
    border: '#eeeeee'
  };

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
      <div className="min-h-screen bg-[#F5F7F9] flex flex-col">
        <header className="bg-white p-4 sticky top-0 z-50 border-b border-[#eee] flex items-center">
          <button onClick={() => navigate(-1)} className="mr-4">
            <ArrowLeft className="w-6 h-6 text-[#1F1F1F]" />
          </button>
          <h1 className="text-lg font-bold text-[#1F1F1F]">Your Cart</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
            <Clock className="w-12 h-12 text-[#ccc]" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-[#1F1F1F]">Your cart is empty</h2>
          <p className="text-[#666] mb-8">Add items to start a cart</p>
          <Button 
            className="bg-[#0C831F] hover:bg-[#096e1a] text-white font-bold py-3 px-8 rounded-xl"
            onClick={() => navigate('/')}
          >
            Start Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] text-[#1F1F1F] font-sans pb-[180px]">
      
      {/* HEADER */}
      <header className="bg-white px-5 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-[#eeeeee]">
        <div className="flex items-center gap-4 text-lg font-extrabold cursor-pointer" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
          Your Cart
        </div>
        <div className="bg-[#eee] w-10 h-5 rounded-full relative">
          <div className="bg-white w-4 h-4 rounded-full absolute left-0.5 top-0.5 border border-[#ddd]"></div>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto p-4 space-y-4">
        
        {/* ITEM SECTION */}
        <section className="bg-white rounded-xl p-5 border border-[#eeeeee]">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2 font-extrabold text-lg">
              <Clock className="w-5 h-5 text-[#0C831F]" />
              15 Mins <span className="bg-[#E7F6E8] text-[#0C831F] text-[10px] px-2 py-0.5 rounded uppercase">Superfast</span>
            </div>
            <div className="text-xs text-[#666]">{items.length} items</div>
          </div>

          {items.map((item) => (
            <div key={item.product_id} className="flex items-center gap-4 pb-5 border-b border-dashed border-[#eeeeee] mb-5 last:border-0 last:mb-0 last:pb-0">
              <img src={item.image_url} alt={item.name} className="w-[60px] h-[60px] object-contain rounded-md" />
              <div className="flex-1">
                <div className="font-semibold text-sm mb-1 line-clamp-2">{item.name}</div>
                <div className="text-xs text-[#666]">{item.unit_value} {item.unit_type}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-[#0C831F] bg-[#F7FFF9] rounded-lg overflow-hidden h-9">
                  <button 
                    className="px-3 text-[#0C831F] font-bold hover:bg-[#e8f7ec] h-full flex items-center justify-center"
                    onClick={() => decrementQuantity(item.product_id)}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-[#0C831F] font-extrabold text-sm">{item.quantity}</span>
                  <button 
                    className="px-3 text-[#0C831F] font-bold hover:bg-[#e8f7ec] h-full flex items-center justify-center"
                    onClick={() => incrementQuantity(item.product_id)}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-right min-w-[50px]">
                  {item.mrp > item.selling_price && (
                    <div className="line-through text-[#666] text-[11px]">₹{item.mrp * item.quantity}</div>
                  )}
                  <div className="font-extrabold text-sm">₹{item.selling_price * item.quantity}</div>
                </div>
              </div>
            </div>
          ))}

          <button 
            className="mt-4 w-full border border-[#eeeeee] bg-white py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors"
            onClick={() => navigate('/')}
          >
            <Plus className="w-4 h-4" /> Add more items
          </button>
        </section>

        {/* SAVINGS SECTION (Conditional) */}
        {totalSavings > 0 && (
          <section className="bg-[#f8fff9] border border-[#D1E7DD] rounded-xl p-3 px-5 flex items-center justify-between text-[13px] font-semibold">
            <div className="flex gap-2 items-center">
              <span className="text-[#007AFF]">🏷️</span> 
              Saved ₹{totalSavings} on this order!
            </div>
          </section>
        )}

        {/* UPSELL SECTION */}
        {upsellProducts && upsellProducts.length > 0 && (
          <section className="bg-white rounded-xl p-5 border border-[#eeeeee]">
            <div className="flex gap-5 mb-4 border-b border-[#eeeeee] pb-2 overflow-x-auto no-scrollbar">
              <div className="text-[13px] font-bold text-[#1F1F1F] cursor-pointer whitespace-nowrap border-b-2 border-[#F8CB46] pb-2">Did you forget?</div>
              <div className="text-[13px] font-bold text-[#666] cursor-pointer whitespace-nowrap hover:text-[#1F1F1F]">Trending Now</div>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {upsellProducts.slice(0, 6).map((product) => (
                <div key={product.id} className="min-w-[120px] w-[120px] flex-shrink-0 relative">
                  <button 
                    className="absolute top-0 right-0 bg-white border border-[#0C831F] text-[#0C831F] rounded w-[22px] h-[22px] flex items-center justify-center hover:bg-[#0C831F] hover:text-white transition-colors z-10"
                    onClick={() => handleUpsellAdd(product)}
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                  </button>
                  <img 
                    src={product.primary_image_url || '/placeholder.svg'} 
                    alt={product.name} 
                    className="w-full h-[100px] object-contain mb-2 bg-white rounded-lg p-1" 
                  />
                  <div className="text-[9px] text-[#666] font-semibold bg-[#F5F7F9] px-1 py-0.5 rounded w-fit mb-1">15 MINS</div>
                  <div className="text-[11px] font-semibold leading-tight h-[2.4em] overflow-hidden mb-1 line-clamp-2" title={product.name}>
                    {product.name}
                  </div>
                  <div className="text-xs font-extrabold flex items-center gap-1">
                    ₹{product.selling_price}
                    {product.mrp > product.selling_price && (
                      <span className="text-[#999] font-normal line-through text-[10px]">₹{product.mrp}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BAG TOGGLE */}
        <section className="bg-white rounded-xl p-4 border border-[#eeeeee] flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold mb-0.5">I don't need a bag! 🌱</h4>
            <p className="text-xs text-[#666]">Take the pledge for a greener future</p>
          </div>
          <div 
            className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${noBag ? 'bg-[#0C831F]' : 'bg-[#eee]'}`}
            onClick={() => setNoBag(!noBag)}
          >
            <div 
              className={`bg-white w-4 h-4 rounded-full absolute top-0.5 border border-[#ddd] transition-all shadow-sm ${noBag ? 'left-[22px]' : 'left-[2px]'}`}
            ></div>
          </div>
        </section>

        {/* BILL DETAILS */}
        <section className="bg-white rounded-xl p-5 border border-[#eeeeee]">
          <div className="text-xs font-extrabold text-[#666] uppercase mb-4 tracking-wider">Bill Details</div>
          
          <div className="flex justify-between text-[13px] mb-2.5 text-[#1F1F1F]">
            <span>Item Total</span>
            <span>₹{itemTotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-[13px] mb-2.5 text-[#1F1F1F]">
            <span className="flex items-center gap-1">Handling Fee <span className="text-[#007AFF] text-[10px]">ⓘ</span></span>
            <span>₹{handlingFee.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-[13px] mb-2.5 text-[#1F1F1F]">
            <span>Delivery Fee</span>
            {deliveryFee === 0 ? (
               <span className="text-[#0C831F] font-bold">FREE</span>
            ) : (
               <span>₹{deliveryFee.toFixed(2)}</span>
            )}
          </div>
          
          <div className="flex justify-between text-[13px] mb-2.5 text-[#1F1F1F]">
            <span>GST and Charges</span>
            <span>₹{gst.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between font-extrabold text-[15px] pt-4 mt-2 border-t border-[#eeeeee] text-[#1F1F1F]">
            <span>To Pay</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </section>

      </main>

      {/* STICKY FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.05)] p-5 z-[200]">
        <div className="max-w-[800px] mx-auto">
          {/* Summary Row */}
          <div className="flex justify-between items-center mb-4">
             <div className="font-extrabold text-lg flex items-center gap-2">
               To Pay: ₹{Math.round(grandTotal)}
               {(totalSavings > 0) && (
                 <span className="text-[#999] text-[13px] font-normal line-through">
                   ₹{Math.round(grandTotal + totalSavings)}
                 </span>
               )}
             </div>
             <button className="text-[#007AFF] text-[13px] font-bold hover:underline">
               View Detailed Bill
             </button>
          </div>

          {/* Delivery Prompt */}
          <div className="flex items-center gap-2.5 font-bold text-[15px] mb-4">
             <span className="text-[#007AFF] rotate-[-45deg] block">✈️</span>
             Where would you like us to deliver this order?
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
             <button 
               className="flex-1 py-4 rounded-xl font-extrabold text-base bg-[#EEF4FF] text-[#007AFF] hover:bg-[#e0ebff] transition-colors"
               onClick={() => navigate('/addresses')}
             >
               Add Address
             </button>
             <button 
               className="flex-1 py-4 rounded-xl font-extrabold text-base bg-[#0C831F] text-white hover:bg-[#096e1a] transition-colors"
               onClick={handleCheckout}
             >
               {addresses && addresses.length > 0 ? 'Select Address' : 'Proceed to Pay'}
             </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CartPage;
