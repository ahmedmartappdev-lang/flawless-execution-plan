import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BottomNavigation } from '@/components/customer/BottomNavigation';
import { Header } from '@/components/customer/Header';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, incrementQuantity, decrementQuantity, getTotalPrice } = useCartStore();
  
  const totalPrice = getTotalPrice();
  const deliveryFee = totalPrice > 200 ? 0 : 25;
  const handlingCharge = 4;
  const grandTotal = totalPrice + deliveryFee + handlingCharge;

  return (
    <div className="min-h-screen bg-[#f4f6fb] pb-32">
      {/* SHARED HEADER */}
      <Header />

      <main className="max-w-[1000px] mx-auto p-4 md:py-8">
        <h1 className="text-2xl font-bold mb-6 text-[#1f1f1f]">My Cart</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <div className="w-40 h-40 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-16 h-16 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">You don't have any items in your cart yet.</p>
            <Button className="bg-[#0c831f] hover:bg-[#096e1a] text-white font-bold px-8 py-2 mt-4" onClick={() => navigate('/')}>Start Shopping</Button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Column - Cart Items */}
            <div className="flex-grow space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg"><ShoppingCart className="w-5 h-5 text-[#4a75e6]" /></div>
                    <div><h3 className="font-bold text-[#1f1f1f]">Delivery in 15 minutes</h3><p className="text-xs text-gray-500">{items.length} items</p></div>
                  </div>
                </div>
                <Separator className="mb-4" />
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 border border-gray-100 rounded-lg p-1 flex-shrink-0">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-sm font-medium text-[#1f1f1f] line-clamp-2 mb-1">{item.name}</h4>
                        <div className="text-xs text-gray-500 mb-2">{item.unit_value} {item.unit_type}</div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm">₹{item.selling_price * item.quantity}</span>
                          <div className="flex items-center bg-[#0c831f] text-white rounded-md h-8">
                            <button className="px-2.5 h-full hover:bg-[#096e1a] rounded-l-md font-bold" onClick={() => decrementQuantity(item.id)}>-</button>
                            <span className="px-2 text-xs font-bold min-w-[24px] text-center">{item.quantity}</span>
                            <button className="px-2.5 h-full hover:bg-[#096e1a] rounded-r-md font-bold" onClick={() => incrementQuantity(item.id)}>+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Cancellation Policy */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-sm mb-2">Cancellation Policy</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Orders cannot be cancelled once packed for delivery. In case of unexpected delays, a refund will be provided, if applicable.
                </p>
              </div>
            </div>

            {/* Right Column - Bill Details */}
            <div className="md:w-[350px] flex-shrink-0">
              <div className="bg-white rounded-xl p-4 shadow-sm sticky top-24">
                <h3 className="font-bold text-sm mb-4">Bill Details</h3>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between text-gray-600"><span>Item Total</span><span>₹{totalPrice}</span></div>
                  <div className="flex justify-between text-gray-600">
                    <div className="flex items-center gap-1"><span>Delivery Charge</span><span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">{deliveryFee === 0 ? 'FREE' : ''}</span></div>
                    <span className={deliveryFee === 0 ? 'text-[#0c831f]' : ''}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                  </div>
                  <div className="flex justify-between text-gray-600"><span>Handling Charge</span><span>₹{handlingCharge}</span></div>
                </div>
                <Separator className="mb-3" />
                <div className="flex justify-between font-bold text-[#1f1f1f] text-base mb-6"><span>Grand Total</span><span>₹{grandTotal}</span></div>
                <Button className="w-full bg-[#0c831f] hover:bg-[#096e1a] font-bold py-6 text-lg" onClick={() => user ? navigate('/checkout') : navigate('/auth')}>
                  {user ? 'Proceed to Pay' : 'Login to Proceed'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      <BottomNavigation />
    </div>
  );
};

export default CartPage;
