import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, Check, Clock, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '@/stores/cartStore';
import { useProduct, useRelatedProducts, useTrendingProducts } from '@/hooks/useProducts';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Product } from '@/types/database';

const ProductDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem, incrementQuantity, decrementQuantity, getItemQuantity } = useCartStore();

  // 1. Fetch Main Product
  const { data: product, isLoading } = useProduct(slug || '');
  
  // 2. Fetch Similar Products (Same Category)
  const { data: similarProducts, isLoading: similarLoading } = useRelatedProducts(product?.category_id, product?.id);
  
  // 3. Fetch "People Also Bought" (Using Trending logic as fallback)
  const { data: alsoBoughtProducts, isLoading: alsoBoughtLoading } = useTrendingProducts();

  const handleAddToCart = (p: Product) => {
    addItem({
      id: p.id,
      product_id: p.id,
      name: p.name,
      image_url: p.primary_image_url || '/placeholder.svg',
      unit_value: p.unit_value || 1,
      unit_type: p.unit_type,
      selling_price: p.selling_price,
      mrp: p.mrp,
      max_quantity: p.max_order_quantity || 10,
      vendor_id: p.vendor_id,
    });
    toast.success('Added to cart');
  };

  // Helper Component for Horizontal Scroll Items
  const ProductCard = ({ p }: { p: Product }) => {
    const qty = getItemQuantity(p.id);
    const discount = p.mrp > p.selling_price 
      ? Math.round(((p.mrp - p.selling_price) / p.mrp) * 100) 
      : 0;

    return (
      <div className="min-w-[200px] max-w-[200px] border border-border rounded-[12px] p-[12px] relative bg-card flex flex-col h-full hover:shadow-md transition-shadow">
        {discount > 0 && (
          <div className="absolute top-0 left-[10px] bg-primary text-primary-foreground text-[10px] px-[6px] py-[4px] font-extrabold rounded-b-[4px] z-10">
            {discount}% OFF
          </div>
        )}
        <div className="h-[140px] flex items-center justify-center mb-[10px] cursor-pointer" onClick={() => navigate(`/product/${p.slug}`)}>
          <img src={p.primary_image_url || '/placeholder.svg'} alt={p.name} className="max-h-full max-w-full object-contain" />
        </div>
        <div className="bg-muted text-[9px] font-extrabold px-[6px] py-[3px] rounded-[4px] mb-[8px] inline-flex items-center gap-1 w-fit">
          <Clock className="w-3 h-3" /> 16 MINS
        </div>
        <div className="text-[13px] font-semibold leading-[1.3] h-[34px] overflow-hidden mb-[4px] text-foreground line-clamp-2" title={p.name}>
          {p.name}
        </div>
        <div className="text-[12px] text-muted-foreground mb-[15px]">
          {p.unit_value} {p.unit_type}
        </div>
        <div className="flex justify-between items-center mt-auto">
          <span className="text-[13px] font-bold">₹{p.selling_price}</span>
          {qty === 0 ? (
            <button 
              className="border border-primary bg-primary/5 text-primary px-[18px] py-[6px] rounded-[6px] font-bold text-[13px] hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => handleAddToCart(p)}
            >
              ADD
            </button>
          ) : (
            <div className="flex items-center bg-primary text-primary-foreground rounded-[6px] h-[32px]">
              <button 
                className="px-2 h-full font-bold hover:bg-primary/90 rounded-l-[6px]" 
                onClick={() => decrementQuantity(p.id)}
              >-</button>
              <span className="px-2 text-[13px] font-bold min-w-[20px] text-center">{qty}</span>
              <button 
                className="px-2 h-full font-bold hover:bg-primary/90 rounded-r-[6px]" 
                onClick={() => incrementQuantity(p.id)}
              >+</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <CustomerLayout hideBottomNav>
        <div className="min-h-screen flex items-center justify-center">
          <Skeleton className="w-full h-full max-w-4xl rounded-xl" />
        </div>
      </CustomerLayout>
    );
  }

  if (!product) {
    return (
      <CustomerLayout hideBottomNav>
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </CustomerLayout>
    );
  }

  const currentQty = getItemQuantity(product.id);

  return (
    <CustomerLayout hideBottomNav>
      <main className="max-w-[1280px] mx-auto py-10 px-4 md:px-10">
        
        {/* --- PRODUCT DETAIL SECTION --- */}
        <section className="flex flex-col md:flex-row gap-10 md:gap-16 pb-16 border-b border-border">
          
          {/* Left: Gallery */}
          <div className="flex-[1.2] text-center">
            <div className="h-[300px] md:h-[450px] flex items-center justify-center mb-5 border border-transparent">
              <img 
                src={product.primary_image_url || '/placeholder.svg'} 
                alt={product.name} 
                className="max-h-full max-w-full object-contain"
              />
            </div>
            {/* Thumbnails */}
            <div className="flex gap-2.5 justify-center overflow-x-auto">
              <div className="w-[60px] h-[60px] border border-primary rounded-[8px] p-1 cursor-pointer">
                <img src={product.primary_image_url || '/placeholder.svg'} className="w-full h-full object-contain" />
              </div>
              <div className="w-[60px] h-[60px] border border-border rounded-[8px] p-1 cursor-pointer hover:border-muted-foreground opacity-50">
                <img src={product.primary_image_url || '/placeholder.svg'} className="w-full h-full object-contain" />
              </div>
            </div>
          </div>

          {/* Right: Info */}
          <div className="flex-1 pt-5">
            <div className="text-[12px] text-muted-foreground mb-2.5 flex items-center flex-wrap gap-1">
              <span className="cursor-pointer hover:text-primary" onClick={() => navigate('/')}>Home</span> 
              <ChevronRight className="w-3 h-3" />
              <span className="cursor-pointer hover:text-primary" onClick={() => navigate(`/category/${product.category?.slug}`)}>
                {product.category?.name || 'Category'}
              </span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground line-clamp-1">{product.name}</span>
            </div>
            
            {/* Brand Name */}
            {product.brand && (
              <div className="text-[13px] font-bold text-muted-foreground mb-1 uppercase tracking-wide">
                {product.brand}
              </div>
            )}

            <h1 className="text-[24px] font-extrabold mb-3 leading-tight text-foreground">{product.name}</h1>

            {/* Rating and Reviews */}
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1 text-xs font-bold border border-primary/20">
                <Star className="w-3 h-3 fill-primary text-primary" />
                {product.rating || '4.5'}
              </div>
              <span className="text-xs text-muted-foreground font-medium underline cursor-pointer">
                {product.total_reviews || 0} reviews
              </span>
            </div>

            <div className="text-[14px] font-bold mb-4 text-foreground">Select Unit</div>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="border border-primary bg-primary/5 rounded-[12px] px-5 py-3 cursor-pointer min-w-[100px] relative">
                <span className="text-[13px] font-semibold block">{product.unit_value} {product.unit_type}</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[14px] font-extrabold">₹{product.selling_price}</span>
                  
                  {/* MRP with Strikethrough Animation */}
                  {product.mrp > product.selling_price && (
                    <div className="relative">
                      <span className="text-[12px] text-muted-foreground">₹{product.mrp}</span>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="absolute top-1/2 left-0 h-[1px] bg-destructive -translate-y-1/2"
                      />
                    </div>
                  )}
                </div>
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[12px] border-r-[12px] border-t-primary border-r-transparent rounded-bl-lg"></div>
                <Check className="absolute top-[-2px] right-[-2px] w-2.5 h-2.5 text-primary-foreground" />
              </div>
            </div>

            <div className="flex justify-between items-end mb-8 border-b border-border pb-8">
              <div>
                <span className="text-[14px] font-extrabold block">₹{product.selling_price}</span>
                <span className="text-[10px] text-muted-foreground font-medium">(Inclusive of all taxes)</span>
              </div>
              
              {currentQty === 0 ? (
                <button 
                  className="bg-primary text-primary-foreground border-none px-9 py-3 rounded-[8px] font-bold text-[16px] cursor-pointer hover:bg-primary/90 transition-colors"
                  onClick={() => handleAddToCart(product)}
                >
                  Add to cart
                </button>
              ) : (
                <div className="flex items-center bg-primary text-primary-foreground rounded-[8px] h-[48px]">
                  <button 
                    className="px-4 h-full font-bold hover:bg-primary/90 rounded-l-[8px] text-lg" 
                    onClick={() => decrementQuantity(product.id)}
                  >-</button>
                  <span className="px-4 text-[16px] font-bold min-w-[40px] text-center">{currentQty}</span>
                  <button 
                    className="px-4 h-full font-bold hover:bg-primary/90 rounded-r-[8px] text-lg" 
                    onClick={() => incrementQuantity(product.id)}
                  >+</button>
                </div>
              )}
            </div>

            {/* Description Section */}
            {product.description && (
              <div className="mb-10">
                <div className="text-[16px] font-bold mb-3 text-foreground">Product Description</div>
                <p className="text-[13px] text-muted-foreground leading-[1.6]">{product.description}</p>
              </div>
            )}

            <div className="mt-6">
              <div className="text-[14px] font-bold mb-4 text-foreground">Why shop from Ahmad Mart?</div>
              <div className="space-y-6">
                <div className="flex gap-5 items-center">
                  <div className="w-[60px] h-[60px] rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <img src="https://cdn-icons-png.flaticon.com/512/1043/1043425.png" className="w-[30px]" alt="Clock" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold mb-1">Round The Clock Delivery</h4>
                    <p className="text-[12px] text-muted-foreground leading-[1.4]">Get items delivered to your doorstep from dark stores near you, whenever you need them.</p>
                  </div>
                </div>
                <div className="flex gap-5 items-center">
                  <div className="w-[60px] h-[60px] rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <img src="https://cdn-icons-png.flaticon.com/512/1828/1828884.png" className="w-[30px]" alt="Offers" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold mb-1">Best Prices & Offers</h4>
                    <p className="text-[12px] text-muted-foreground leading-[1.4]">Best price destination with offers directly from the manufacturers.</p>
                  </div>
                </div>
                <div className="flex gap-5 items-center">
                  <div className="w-[60px] h-[60px] rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <img src="https://cdn-icons-png.flaticon.com/512/2674/2674486.png" className="w-[30px]" alt="Assortment" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold mb-1">Wide Assortment</h4>
                    <p className="text-[12px] text-muted-foreground leading-[1.4]">Choose from 30,000+ products across food, personal care, household & other categories.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SIMILAR PRODUCTS --- */}
        <section className="py-10">
          <h2 className="text-[20px] font-extrabold mb-5 text-foreground">Similar products</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {similarLoading ? (
               [...Array(5)].map((_, i) => <Skeleton key={i} className="min-w-[200px] h-[300px] rounded-xl" />)
            ) : similarProducts && similarProducts.length > 0 ? (
              similarProducts.map(p => <ProductCard key={p.id} p={p} />)
            ) : (
              <p className="text-muted-foreground text-sm">No similar products found.</p>
            )}
          </div>
        </section>

        {/* --- PEOPLE ALSO BOUGHT --- */}
        <section className="py-10">
          <h2 className="text-[20px] font-extrabold mb-5 text-foreground">People also bought</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {alsoBoughtLoading ? (
               [...Array(5)].map((_, i) => <Skeleton key={i} className="min-w-[200px] h-[300px] rounded-xl" />)
            ) : alsoBoughtProducts && alsoBoughtProducts.length > 0 ? (
              alsoBoughtProducts.map(p => <ProductCard key={p.id} p={p} />)
            ) : (
              <p className="text-muted-foreground text-sm">No recommendations available.</p>
            )}
          </div>
        </section>

      </main>
    </CustomerLayout>
  );
};

export default ProductDetailsPage;
