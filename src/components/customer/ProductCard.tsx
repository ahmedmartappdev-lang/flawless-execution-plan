import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';
import { Product } from '@/types/database';
import { useTimeSlots, isWithinTimeSlots, getTimeSlotDisplayText } from '@/hooks/useTimeSlots';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem, getItemQuantity, incrementQuantity, decrementQuantity } = useCartStore();
  const { data: allTimeSlots } = useTimeSlots();

  // Fetch product's assigned time slots
  const { data: productSlotIds } = useQuery({
    queryKey: ['product-time-slots', product.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_time_slots' as any)
        .select('time_slot_id')
        .eq('product_id', product.id);
      if (error) return [];
      return ((data || []) as any[]).map((d: any) => d.time_slot_id as string);
    },
  });

  const isAvailableNow = !productSlotIds || productSlotIds.length === 0 || (allTimeSlots ? isWithinTimeSlots(allTimeSlots, productSlotIds) : true);
  const slotText = allTimeSlots && productSlotIds && productSlotIds.length > 0
    ? getTimeSlotDisplayText(allTimeSlots, productSlotIds)
    : '';

  const variants = (Array.isArray(product.variants) && product.variants.length) ? product.variants : null;
  const defaultVariant = variants ? variants[0] : null;

  const displayPrice = product.admin_selling_price ?? product.selling_price;
  const displayMrp = defaultVariant?.mrp ?? product.mrp;
  const displayUnit = defaultVariant
    ? `${defaultVariant.unit_value} ${defaultVariant.unit_type}`
    : `${product.unit_value || ''}${product.unit_type || ''}`;
  const stockQty = defaultVariant?.stock_quantity ?? product.stock_quantity ?? 0;
  const isOutOfStock = stockQty <= 0 || product.status === 'out_of_stock';

  const cartKey = defaultVariant ? `${product.id}:${defaultVariant.id}` : product.id;
  const quantity = getItemQuantity(cartKey);

  const discountPercent = displayMrp > displayPrice
    ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100)
    : 0;

  const hasMultipleVariants = variants && variants.length > 1;
  const isDisabled = isOutOfStock || !isAvailableNow;

  const handleAddToCart = () => {
    if (!isAvailableNow) return;
    addItem({
      id: cartKey,
      product_id: product.id,
      variant_id: defaultVariant?.id,
      name: product.name,
      image_url: product.primary_image_url || '/placeholder.svg',
      unit_value: defaultVariant?.unit_value ?? product.unit_value ?? 1,
      unit_type: defaultVariant?.unit_type ?? product.unit_type,
      selling_price: product.admin_selling_price ?? product.selling_price,
      mrp: displayMrp,
      max_quantity: product.max_order_quantity,
      vendor_id: product.vendor_id,
      vendor_name: (product as any).vendor?.business_name || undefined,
      stock_quantity: defaultVariant?.stock_quantity ?? product.stock_quantity,
    });
  };

  return (
    <motion.div
      className={`product-card bg-card rounded-xl border border-border overflow-hidden ${!isAvailableNow ? 'opacity-50 grayscale' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image Section */}
      <div className="relative flex items-center justify-center pt-4 pb-2">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-muted/40">
          <img
            src={product.primary_image_url || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-full object-cover scale-110"
            loading="lazy"
          />
        </div>
        {discountPercent > 0 && (
          <div className="discount-badge">
            {discountPercent}% OFF
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
            <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
        {!isOutOfStock && !isAvailableNow && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
            <div className="text-center px-2">
              <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">Not available now</span>
            </div>
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 mb-0.5 text-foreground">
          {product.name}
        </h3>
        {(product as any).vendor?.business_name && (
          <p className="text-[10px] text-muted-foreground mb-0.5">Sold by {(product as any).vendor.business_name}</p>
        )}
        <p className="text-xs text-muted-foreground mb-2">
          {displayUnit}
          {hasMultipleVariants && (
            <span className="ml-1 text-primary font-medium">+{variants!.length - 1} more</span>
          )}
        </p>

        {/* Time slot info */}
        {slotText && (
          <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {slotText}
          </p>
        )}

        {/* Price Row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="font-bold text-lg text-foreground">
            ₹{displayPrice}
          </span>
          {discountPercent > 0 && (
            <span className="text-xs text-muted-foreground line-through">
              ₹{displayMrp}
            </span>
          )}
        </div>

        {/* Add to Cart / Quantity Control */}
        {isDisabled ? (
          <Button disabled className="w-full bg-muted text-muted-foreground cursor-not-allowed" size="sm">
            {isOutOfStock ? 'Out of Stock' : 'Unavailable'}
          </Button>
        ) : quantity === 0 ? (
          <Button
            onClick={handleAddToCart}
            className="w-full bg-transparent text-foreground border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary font-semibold transition-colors"
            size="sm"
            variant="outline"
          >
            ADD
          </Button>
        ) : (
          <div className="quantity-control">
            <button
              onClick={() => decrementQuantity(cartKey)}
              className="quantity-btn"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="flex-1 text-center font-semibold text-primary">
              {quantity}
            </span>
            <button
              onClick={() => incrementQuantity(cartKey)}
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
