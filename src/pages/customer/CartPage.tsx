import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingCart, Tag, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNavigation } from '@/components/customer/BottomNavigation';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/hooks/useAuth';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    items,
    incrementQuantity,
    decrementQuantity,
    removeItem,
    getTotalAmount,
    getTotalItems,
    getDeliveryFee,
  } = useCartStore();

  const subtotal = getTotalAmount();
  const deliveryFee = getDeliveryFee();
  const platformFee = 5;
  const total = subtotal + deliveryFee + platformFee;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Cart</h1>
          </div>
        </header>

        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Add products to get started
            </p>
            <Link to="/">
              <Button>Start Shopping</Button>
            </Link>
          </motion.div>
        </div>

        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Cart</h1>
          <span className="ml-auto text-sm text-muted-foreground">
            {getTotalItems()} items
          </span>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Cart Items */}
        <div className="bg-background rounded-xl border border-border divide-y divide-border">
          {items.map((item) => (
            <motion.div
              key={item.product_id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-4 flex gap-3"
            >
              <img
                src={item.image_url}
                alt={item.name}
                className="w-20 h-20 object-cover rounded-lg bg-muted"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-2 mb-1">
                  {item.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {item.unit_value}{item.unit_type}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold">₹{item.selling_price}</span>
                    {item.mrp > item.selling_price && (
                      <span className="text-xs text-muted-foreground line-through ml-2">
                        ₹{item.mrp}
                      </span>
                    )}
                  </div>
                  <div className="quantity-control">
                    <button
                      onClick={() => decrementQuantity(item.product_id)}
                      className="quantity-btn"
                    >
                      {item.quantity === 1 ? (
                        <Trash2 className="w-3.5 h-3.5" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="w-8 text-center font-semibold text-sm text-primary">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => incrementQuantity(item.product_id)}
                      className="quantity-btn"
                      disabled={item.quantity >= item.max_quantity}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Coupon Section */}
        <div className="bg-background rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5 text-primary" />
              <span className="font-medium">Apply Coupon</span>
            </div>
            <Button variant="ghost" size="sm">
              Select
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Bill Details */}
        <div className="bg-background rounded-xl border border-border p-4">
          <h3 className="font-semibold mb-4">Bill Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Item Total</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
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
            <div className="border-t border-border pt-2 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
          
          {subtotal < 199 && (
            <p className="text-xs text-muted-foreground mt-3">
              Add ₹{(199 - subtotal).toFixed(2)} more for free delivery
            </p>
          )}
        </div>
      </main>

      {/* Checkout Button */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border p-4">
        <Button onClick={handleCheckout} className="w-full" size="lg">
          Proceed to Checkout • ₹{total.toFixed(2)}
        </Button>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default CartPage;
