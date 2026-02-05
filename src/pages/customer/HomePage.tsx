import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, MapPin, Clock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useCategories } from '@/hooks/useCategories';
import { useFeaturedProducts, useTrendingProducts } from '@/hooks/useProducts';
import { Product } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, addItem, removeItem, incrementQuantity, decrementQuantity, getItemQuantity } = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Data
  const { data: categories, isLoading: isCatLoading } = useCategories();
  const { data: featuredProducts, isLoading: isFeatLoading } = useFeaturedProducts();
  const { data: trendingProducts, isLoading: isTrendLoading } = useTrendingProducts();

  // Handlers
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleAddToCart = (product: Product) => {
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
    toast.success('Item added to cart');
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const qty = getItemQuantity(product.id);
    const discount = product.mrp > product.selling_price 
      ? Math.round(((product.mrp - product.selling_price) / product.mrp) * 100) 
      : 0;

    return (
      <div className="border border-[#e8e8e8] rounded-xl p-3 relative bg-white hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
        {discount > 0 && (
          <div className="absolute top-0 left-[10px] bg-[#4a75e6] text-white text-[10px] font-extrabold px-1.5 py-1 rounded-b-md z-10">
            {discount}% OFF
          </div>
        )}
        
        <div className="h-[140px] flex items-center justify-center mb-2 cursor-pointer" onClick={() => navigate(`/product/${product.slug}`)}>
          <img 
            src={product.primary_image_url || '/placeholder.svg'} 
            alt={product.name} 
            className="max-h-full max-w-full object-contain"
          />
        </div>

        <div className="bg-[#f8f8f8] text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 w-fit mb-2">
          <Clock className="w-3 h-3" />
          15 MINS
        </div>

        <h3 className="text-[13px] font-semibold leading-[1.3] h-[34px] overflow-hidden mb-1 text-[#1f1f1f] line-clamp-2" title={product.name}>
          {product.name}
        </h3>

        <div className="text-[12px] text-[#666] mb-3">
          {product.unit_value} {product.unit_type}
        </div>

        <div className="mt-auto flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[13px] font-bold">₹{product.selling_price}</span>
            {product.mrp > product.selling_price && (
              <span className="text-[11px] text-[#888] line-through">₹{product.mrp}</span>
            )}
          </div>

          {qty === 0 ? (
            <button 
              className="border border-[#0c831f] bg-[#f7fff9] text-[#0c831f] px-5 py-1.5 rounded-md font-bold text-[13px] hover:bg-[#0c831f] hover:text-white transition-colors uppercase"
              onClick={() => handleAddToCart(product)}
            >
              ADD
            </button>
          ) : (
            <div className="flex items-center bg-[#0c831f] text-white rounded-md h-[30px]">
              <button 
                className="px-2 h-full font-bold hover:bg-[#096e1a] rounded-l-md"
                onClick={() => decrementQuantity(product.id)}
              >
                -
              </button>
              <span className="px-1 text-[13px] font-bold min-w-[20px] text-center">{qty}</span>
              <button 
                className="px-2 h-full font-bold hover:bg-[#096e1a] rounded-r-md"
                onClick={() => incrementQuantity(product.id)}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-[#1f1f1f] font-sans">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#eeeeee] px-[6%] py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-10">
          <div className="text-[32px] font-black tracking-tighter cursor-pointer select-none" onClick={() => navigate('/')}>
            <span className="text-[#f8cb46]">blink</span>
            <span className="text-[#0c831f]">it</span>
          </div>
          
          <div className="hidden lg:block border-l border-[#ddd] pl-5 cursor-pointer min-w-[200px]">
            <div className="font-extrabold text-[14px] mb-0.5">Delivery in 15 minutes</div>
            <div className="text-[13px] text-[#666] truncate max-w-[200px] flex items-center gap-1">
              Knowledge Park II, Greater... <span className="text-[10px]">▼</span>
            </div>
          </div>
        </div>

        <div className="flex-grow mx-10 relative hidden md:block">
          <Search className="absolute left-[15px] top-[14px] text-[#888] w-4 h-4" />
          <input 
            type="text" 
            className="w-full bg-[#f8f8f8] border border-[#efefef] rounded-[10px] py-[14px] pl-[45px] pr-[14px] text-[14px] outline-none focus:border-[#0c831f] transition-colors"
            placeholder="Search 'milk'"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>

        <div className="flex items-center gap-[30px]">
          <div className="hidden md:flex items-center gap-2 font-medium text-[16px] cursor-pointer" onClick={() => user ? navigate('/profile') : navigate('/auth')}>
            {user ? 'Profile' : 'Login'}
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

      {/* MOBILE SEARCH (Visible only on small screens) */}
      <div className="md:hidden px-4 py-3 bg-white border-b sticky top-[73px] z-40">
        <div className="relative">
          <Search className="absolute left-[15px] top-[12px] text-[#888] w-4 h-4" />
          <input 
            type="text" 
            className="w-full bg-[#f8f8f8] border border-[#efefef] rounded-[10px] py-[10px] pl-[40px] pr-[14px] text-[14px] outline-none"
            placeholder="Search for products"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto p-5">
        
        {/* PROMO BANNERS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-[15px] mb-10">
          <div className="bg-[#eef9f1] rounded-[16px] p-6 h-[180px] flex relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-[65%] z-10">
              <h2 className="text-[20px] font-extrabold mb-2 leading-[1.2]">Pharmacy at your doorstep!</h2>
              <p className="text-[12px] mb-[15px] text-[#444]">Cough syrups, pain relief & more</p>
              <button className="bg-black text-white px-4 py-2 rounded-md font-semibold text-[12px]">Order Now</button>
            </div>
            <img src="https://cdn-icons-png.flaticon.com/512/3028/3028560.png" className="absolute right-0 bottom-0 h-[90%] object-contain group-hover:scale-105 transition-transform" alt="Pharmacy" />
          </div>

          <div className="bg-[#fffce5] rounded-[16px] p-6 h-[180px] flex relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-[65%] z-10">
              <h2 className="text-[20px] font-extrabold mb-2 leading-[1.2]">Pet care supplies at your door</h2>
              <p className="text-[12px] mb-[15px] text-[#444]">Food, treats, toys & more</p>
              <button className="bg-black text-white px-4 py-2 rounded-md font-semibold text-[12px]">Order Now</button>
            </div>
            <img src="https://cdn-icons-png.flaticon.com/512/616/616408.png" className="absolute right-0 bottom-0 h-[90%] object-contain group-hover:scale-105 transition-transform" alt="Pet Care" />
          </div>

          <div className="bg-[#f1f7ff] rounded-[16px] p-6 h-[180px] flex relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-[65%] z-10">
              <h2 className="text-[20px] font-extrabold mb-2 leading-[1.2]">No time for a diaper run?</h2>
              <p className="text-[12px] mb-[15px] text-[#444]">Get baby care essentials</p>
              <button className="bg-black text-white px-4 py-2 rounded-md font-semibold text-[12px]">Order Now</button>
            </div>
            <img src="https://cdn-icons-png.flaticon.com/512/2764/2764353.png" className="absolute right-0 bottom-0 h-[90%] object-contain group-hover:scale-105 transition-transform" alt="Baby Care" />
          </div>
        </section>

        {/* CATEGORIES GRID */}
        <section className="mb-[50px]">
          {isCatLoading ? (
             <div className="grid grid-cols-4 md:grid-cols-10 gap-[12px]">
               {[...Array(10)].map((_, i) => (
                 <div key={i} className="flex flex-col items-center gap-2">
                   <Skeleton className="w-full aspect-square rounded-[12px]" />
                   <Skeleton className="h-3 w-16" />
                 </div>
               ))}
             </div>
          ) : !categories || categories.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No categories found.
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-[12px]">
              {categories.map((cat) => (
                <div 
                  key={cat.id} 
                  className="text-center cursor-pointer group"
                  onClick={() => navigate(`/category/${cat.slug}`)}
                >
                  <div className="bg-[#f4f4f4] rounded-[12px] aspect-square mb-2 flex items-center justify-center p-2.5 group-hover:bg-[#e8e8e8] transition-colors">
                    <img 
                      src={cat.image_url || cat.icon_url || '/placeholder.svg'} 
                      alt={cat.name} 
                      className="w-full h-full object-contain drop-shadow-sm"
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-[#333] leading-[1.2] block truncate px-1">
                    {cat.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FEATURED PRODUCTS (Replaces 'Dairy, Bread & Eggs' row) */}
        <section className="mb-[50px]">
          <div className="flex justify-between items-center mb-[20px]">
            <h3 className="text-[24px] font-bold text-[#1f1f1f]">Featured Products</h3>
            <span className="text-[#0c831f] font-bold text-[16px] cursor-pointer hover:underline">see all</span>
          </div>

          {isFeatLoading ? (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[15px]">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-[240px] rounded-xl" />
                ))}
             </div>
          ) : !featuredProducts || featuredProducts.length === 0 ? (
             <div className="text-center py-8 bg-muted/20 rounded-lg">No featured products available</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[15px]">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* TRENDING PRODUCTS (Replaces 'Rolling paper' row) */}
        <section className="mb-[50px]">
          <div className="flex justify-between items-center mb-[20px]">
            <h3 className="text-[24px] font-bold text-[#1f1f1f]">Trending Now</h3>
            <span className="text-[#0c831f] font-bold text-[16px] cursor-pointer hover:underline">see all</span>
          </div>

          {isTrendLoading ? (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[15px]">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-[240px] rounded-xl" />
                ))}
             </div>
          ) : !trendingProducts || trendingProducts.length === 0 ? (
             <div className="text-center py-8 bg-muted/20 rounded-lg">No trending products available</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[15px]">
              {trendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
};

export default HomePage;
