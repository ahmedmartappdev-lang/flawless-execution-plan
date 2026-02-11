import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { Product } from '@/types/database';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem, getItemQuantity, incrementQuantity, decrementQuantity } = useCartStore();
  const quantity = getItemQuantity(product.id);
  
  const discountPercent = product.mrp > product.selling_price
    ? Math.round(((product.mrp - product.selling_price) / product.mrp) * 100)
    : 0;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      product_id: product.id,
      name: product.name,
      image_url: product.primary_image_url || '/placeholder.svg',
      unit_value: product.unit_value || 1,
      unit_type: product.unit_type,
      selling_price: product.selling_price,
      mrp: product.mrp,
      max_quantity: product.max_order_quantity,
      vendor_id: product.vendor_id,
    });
  };

  return (
    <motion.div
      className="product-card bg-card rounded-xl border border-border overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image Section */}
      <div className="relative flex items-center justify-center pt-4 pb-2">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border border-border">
          <img
            src={product.primary_image_url || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        {discountPercent > 0 && (
          <div className="discount-badge">
            {discountPercent}% OFF
          </div>
        )}
        {product.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 mb-1 text-foreground">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">
          {product.unit_value}{product.unit_type}
        </p>

        {/* Price Row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-bold text-lg text-foreground">
            ₹{product.selling_price}
          </span>
          {discountPercent > 0 && (
            <span className="text-xs text-muted-foreground line-through">
              ₹{product.mrp}
            </span>
          )}
        </div>

        {/* Add to Cart / Quantity Control */}
        {product.stock_quantity === 0 ? (
          <Button disabled className="w-full" size="sm">
            Out of Stock
          </Button>
        ) : quantity === 0 ? (
          <Button
            onClick={handleAddToCart}
            className="w-full add-to-cart-btn"
            size="sm"
            variant="outline"
          >
            ADD
          </Button>
        ) : (
          <div className="quantity-control">
            <button
              onClick={() => decrementQuantity(product.id)}
              className="quantity-btn"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="flex-1 text-center font-semibold text-primary">
              {quantity}
            </span>
            <button
              onClick={() => incrementQuantity(product.id)}
              className="quantity-btn"
              disabled={quantity >= product.max_order_quantity}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
