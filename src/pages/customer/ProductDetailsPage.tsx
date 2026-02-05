import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, ChevronRight, Check, Clock, ChevronDown, Star } from 'lucide-react';
import { motion } from 'framer-motion'; // Import Framer Motion
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useProduct, useRelatedProducts, useTrendingProducts } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Product } from '@/types/database';

const ProductDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, addItem, incrementQuantity, decrementQuantity, getItemQuantity } = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Main Product
  const { data: product, isLoading } = useProduct(slug || '');
  
  // 2. Fetch Similar Products (Same Category)
  const { data: similarProducts, isLoading: similarLoading } = useRelatedProducts(product?.category_id, product?.id);
  
  // 3. Fetch "People Also Bought" (Using Trending logic as fallback)
  const { data: alsoBoughtProducts, isLoading: alsoBoughtLoading } = useTrendingProducts();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

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
      <div className="min-w-[200px] max-w-[200px] border border-[#eee] rounded-[12px] p-[12px] relative bg-white flex flex-col h-full hover:shadow-md transition-shadow">
        {discount > 0 && (
          <div className="absolute top-0 left-[10px] bg-[#4a75e6] text-white text-[10px] px-[6px] py-[4px] font-extrabold rounded-b-[4px] z-10">
            {discount}% OFF
          </div>
        )}
        <div className="h-[140px] flex items-center justify-center mb-[10px] cursor-pointer" onClick={() => navigate(`/product/${p.slug}`)}>
          <img src={p.primary_image_url || '/placeholder.svg'} alt={p.name} className="max-h-full max-w-full object-contain" />
        </div>
        <div className="bg-[#f8f8f8] text-[9px] font-extrabold px-[6px] py-[3px] rounded-[4px] mb-[8px] inline-flex items-center gap-1 w-fit">
          <Clock className="w-3 h-3" /> 16 MINS
        </div>
        <div className="text-[13px] font-semibold leading-[1.3] h-[34px] overflow-hidden mb-[4px] text-[#1f1f1f] line-clamp-2" title={p.name}>
          {p.name}
        </div>
        <div className="text-[12px] text-[#666] mb-[15px]">
          {p.unit_value} {p.unit_type}
        </div>
        <div className="flex justify-between items-center mt-auto">
          <span className="text-[13px] font-bold">₹{p.selling_price}</span>
          {qty === 0 ? (
            <button 
              className="border border-[#0c831f] bg-[#f7fff9] text-[#0c831f] px-[18px] py-[6px] rounded-[6px] font-bold text-[13px] hover:bg-[#0c831f] hover:text-white transition-colors"
              onClick={() => handleAddToCart(p)}
            >
              ADD
            </button>
          ) : (
            <div className="flex items-center bg-[#0c831f] text-white rounded-[6px] h-[32px]">
              <button 
                className="px-2 h-full font-bold hover:bg-[#096e1a] rounded-l-[6px]" 
                onClick={() => decrementQuantity(p.id)}
              >-</button>
              <span className="px-2 text-[13px] font-bold min-w-[20px] text-center">{qty}</span>
              <button 
                className="px-2 h-full font-bold hover:bg-[#096e1a] rounded-r-[6px]" 
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Skeleton className="w-full h-full max-w-4xl rounded-xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  const currentQty = getItemQuantity(product.id);

  return (
    <div className="min-h-screen bg-white text-[#1f1f1f] font-sans pb-20">
      
      {/* --- HEADER (Same as HomePage) --- */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#eeeeee] px-[6%] py-3 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <div className="text-[32px] font-black tracking-tighter cursor-pointer select-none" onClick={() => navigate('/')}>
            <span className="text-[#f8cb46]">blink</span>
            <span className="text-[#0c831f]">it</span>
          </div>
          
          <div className="hidden lg:block border-l border-[#ddd] pl-5 cursor-pointer min-w-[240px]">
            <div className="font-extrabold text-[14px] mb-0.5">Delivery in 16 minutes</div>
            <div className="text-[13px] text-[#666] truncate flex items-center gap-1">
              Knowledge Park II, Greater... <span className="text-[10px]">▼</span>
            </div>
          </div>
        </div>

        <div className="flex-grow mx-10 relative hidden md:block">
          <Search className="absolute left-[15px] top-[14px] text-[#888] w-4 h-4" />
          <input 
            type="text" 
            className="w-full bg-[#f8f8f8] border border-[#efefef] rounded-[10px] py-[14px] pl-[45px] pr-[14px] text-[14px] outline-none focus:border-[#0c831f] transition-colors"
            placeholder="Search 'bread'"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>

        <div className="flex items-center gap-[30px]">
          <div className="hidden md:flex items-center gap-2 font-semibold text-[16px] cursor-pointer" onClick={() => user ? navigate('/profile') : navigate('/auth')}>
            {user ? 'Account' : 'Login'} <ChevronDown className="w-4 h-4" />
          </div>
          <button 
            className="bg-[#0c831f] text-white px-[20px] py-[12px] rounded-[8px] font-bold border-none flex items-center gap-[10px] cursor-pointer hover:bg-[#096e1a]"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline">My Cart</span>
            {items.length > 0 && (
              <div className="bg-white text-[#0c831f] text-xs font-bold px-1.5 py-0.5 rounded-full">
                {items.length}
              </div>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto py-10 px-4 md:px-10">
        
        {/* --- PRODUCT DETAIL SECTION --- */}
        <section className="flex flex-col md:flex-row gap-10 md:gap-16 pb-16 border-b border-[#eeeeee]">
          
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
              <div className="w-[60px] h-[60px] border border-[#0c831f] rounded-[8px] p-1 cursor-pointer">
                <img src={product.primary_image_url || '/placeholder.svg'} className="w-full h-full object-contain" />
              </div>
              <div className="w-[60px] h-[60px] border border-[#eee] rounded-[8px] p-1 cursor-pointer hover:border-[#ccc] opacity-50">
                <img src={product.primary_image_url || '/placeholder.svg'} className="w-full h-full object-contain" />
              </div>
            </div>
          </div>

          {/* Right: Info */}
          <div className="flex-1 pt-5">
            <div className="text-[12px] text-[#666] mb-2.5 flex items-center flex-wrap gap-1">
              <span className="cursor-pointer hover:text-[#0c831f]" onClick={() => navigate('/')}>Home</span> 
              <ChevronRight className="w-3 h-3" />
              <span className="cursor-pointer hover:text-[#0c831f]" onClick={() => navigate(`/category/${product.category?.slug}`)}>
                {product.category?.name || 'Category'}
              </span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#1f1f1f] line-clamp-1">{product.name}</span>
            </div>
            
            {/* Brand Name */}
            {product.brand && (
              <div className="text-[13px] font-bold text-[#666] mb-1 uppercase tracking-wide">
                {product.brand}
              </div>
            )}

            <h1 className="text-[24px] font-extrabold mb-3 leading-tight text-[#1f1f1f]">{product.name}</h1>

            {/* Rating and Reviews */}
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#e7f6e8] text-[#0c831f] px-2 py-0.5 rounded flex items-center gap-1 text-xs font-bold border border-[#e7f6e8]">
                <Star className="w-3 h-3 fill-[#0c831f] text-[#0c831f]" />
                {product.rating || '4.5'}
              </div>
              <span className="text-xs text-[#666] font-medium underline cursor-pointer">
                {product.total_reviews || 0} reviews
              </span>
            </div>

            <div className="text-[14px] font-bold mb-4 text-[#333]">Select Unit</div>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="border border-[#0c831f] bg-[#f7fff9] rounded-[12px] px-5 py-3 cursor-pointer min-w-[100px] relative">
                <span className="text-[13px] font-semibold block">{product.unit_value} {product.unit_type}</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[14px] font-extrabold">₹{product.selling_price}</span>
                  
                  {/* MRP with Strikethrough Animation */}
                  {product.mrp > product.selling_price && (
                    <div className="relative">
                      <span className="text-[12px] text-[#666]">₹{product.mrp}</span>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="absolute top-1/2 left-0 h-[1px] bg-red-500 -translate-y-1/2"
                      />
                    </div>
                  )}
                </div>
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[12px] border-r-[12px] border-t-[#0c831f] border-r-transparent rounded-bl-lg"></div>
                <Check className="absolute top-[-2px] right-[-2px] w-2.5 h-2.5 text-white" />
              </div>
            </div>

            <div className="flex justify-between items-end mb-8 border-b border-[#f0f0f0] pb-8">
              <div>
                <span className="text-[14px] font-extrabold block">₹{product.selling_price}</span>
                <span className="text-[10px] text-[#666] font-medium">(Inclusive of all taxes)</span>
              </div>
              
              {currentQty === 0 ? (
                <button 
                  className="bg-[#0c831f] text-white border-none px-9 py-3 rounded-[8px] font-bold text-[16px] cursor-pointer hover:bg-[#096e1a] transition-colors"
                  onClick={() => handleAddToCart(product)}
                >
                  Add to cart
                </button>
              ) : (
                <div className="flex items-center bg-[#0c831f] text-white rounded-[8px] h-[48px]">
                  <button 
                    className="px-4 h-full font-bold hover:bg-[#096e1a] rounded-l-[8px] text-lg" 
                    onClick={() => decrementQuantity(product.id)}
                  >-</button>
                  <span className="px-4 text-[16px] font-bold min-w-[40px] text-center">{currentQty}</span>
                  <button 
                    className="px-4 h-full font-bold hover:bg-[#096e1a] rounded-r-[8px] text-lg" 
                    onClick={() => incrementQuantity(product.id)}
                  >+</button>
                </div>
              )}
            </div>

            {/* Description Section */}
            {product.description && (
              <div className="mb-10">
                <div className="text-[16px] font-bold mb-3 text-[#1f1f1f]">Product Description</div>
                <p className="text-[13px] text-[#666] leading-[1.6]">{product.description}</p>
              </div>
            )}

            <div className="mt-6">
              <div className="text-[14px] font-bold mb-4 text-[#333]">Why shop from blinkit?</div>
              <div className="space-y-6">
                <div className="flex gap-5 items-center">
                  <div className="w-[60px] h-[60px] rounded-full bg-[#fdf6e3] flex items-center justify-center shrink-0">
                    <img src="https://cdn-icons-png.flaticon.com/512/1043/1043425.png" className="w-[30px]" alt="Clock" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold mb-1">Round The Clock Delivery</h4>
                    <p className="text-[12px] text-[#666] leading-[1.4]">Get items delivered to your doorstep from dark stores near you, whenever you need them.</p>
                  </div>
                </div>
                <div className="flex gap-5 items-center">
                  <div className="w-[60px] h-[60px] rounded-full bg-[#e7f6e8] flex items-center justify-center shrink-0">
                    <img src="https://cdn-icons-png.flaticon.com/512/1828/1828884.png" className="w-[30px]" alt="Offers" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold mb-1">Best Prices & Offers</h4>
                    <p className="text-[12px] text-[#666] leading-[1.4]">Best price destination with offers directly from the manufacturers.</p>
                  </div>
                </div>
                <div className="flex gap-5 items-center">
                  <div className="w-[60px] h-[60px] rounded-full bg-[#f1f7ff] flex items-center justify-center shrink-0">
                    <img src="https://cdn-icons-png.flaticon.com/512/2674/2674486.png" className="w-[30px]" alt="Assortment" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold mb-1">Wide Assortment</h4>
                    <p className="text-[12px] text-[#666] leading-[1.4]">Choose from 30,000+ products across food, personal care, household & other categories.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SIMILAR PRODUCTS --- */}
        <section className="py-10">
          <h2 className="text-[20px] font-extrabold mb-5 text-[#1f1f1f]">Similar products</h2>
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
          <h2 className="text-[20px] font-extrabold mb-5 text-[#1f1f1f]">People also bought</h2>
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
    </div>
  );
};

export default ProductDetailsPage;
