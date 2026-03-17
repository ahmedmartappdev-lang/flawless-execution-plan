import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { useCategories } from '@/hooks/useCategories';
import { useFeaturedProducts, useTrendingProducts } from '@/hooks/useProducts';
import { useBanners } from '@/hooks/useBanners';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Backend Integration Hooks
  const { data: categories, isLoading: isCatLoading } = useCategories();
  const { data: featuredProducts, isLoading: isFeatLoading } = useFeaturedProducts();
  const { data: trendingProducts, isLoading: isTrendLoading } = useTrendingProducts();
  const { data: banners } = useBanners();
  const addItem = useCartStore((state) => state.addItem);

  // Helper arrays for the "Shop By Category" grid colors
  const bgColors = ['bg-[#E9F5E6]', 'bg-[#FEF3E2]', 'bg-[#FEE2E2]', 'bg-dark'];
  const textColors = ['text-dark', 'text-dark', 'text-dark', 'text-white'];
  const subTextColors = ['text-secondary', 'text-[#D97706]', 'text-[#DC2626]', 'text-white/90'];

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation(); // Prevents navigating to product page when clicking "Add"
    addItem({ ...product, quantity: 1 });
    toast({
      title: "Added to cart",
      description: `${product.name} added to your cart.`,
      duration: 2000,
    });
  };

  return (
    <CustomerLayout>
      <div className="space-y-6 bg-surface min-h-screen pb-24 font-sans max-w-[1280px] mx-auto md:pt-4">
        
        {/* BEGIN: HeroCarousel */}
        <section className="px-4 pt-4">
          <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 pb-2">
            {banners && banners.length > 0 ? (
              banners.map((banner) => (
                <div 
                  key={banner.id} 
                  onClick={() => banner.link_url && navigate(banner.link_url)}
                  className="min-w-[85vw] md:min-w-[400px] snap-center bg-dark rounded-premium p-6 text-white flex flex-col justify-between h-44 relative overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                >
                  {banner.image_url && (
                    <img src={banner.image_url} alt={banner.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                  )}
                  <div className="z-10 relative">
                    <h3 className="text-xl font-bold leading-tight tracking-tight drop-shadow-md">{banner.title}</h3>
                  </div>
                </div>
              ))
            ) : (
              // Fallback Banners
              <>
                <div className="min-w-[85vw] md:min-w-[400px] snap-center bg-dark rounded-premium p-6 text-white flex flex-col justify-between h-44 relative overflow-hidden">
                  <div className="z-10">
                    <h3 className="text-xl font-bold leading-tight tracking-tight">Shop Now.<br />Pay Later.</h3>
                    <p className="text-xs text-white/70 mt-1">With Ahmad Credit Card</p>
                  </div>
                  <button className="bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-full w-max z-10">Apply Now</button>
                  <div className="absolute -right-4 -bottom-4 w-32 h-20 bg-primary/20 rounded-lg rotate-12 border border-white/10"></div>
                  <div className="absolute -right-2 -bottom-2 w-32 h-20 bg-primary/40 rounded-lg rotate-6 border border-white/20"></div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* BEGIN: CreditStrip */}
        <section className="px-4 md:max-w-md">
          <div className="bg-white p-4 rounded-premium border border-gray-100 flex items-center justify-between shadow-sm cursor-pointer hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-bold text-textMain">Ahmad Credit Card Active</h4>
                <p className="text-xs text-primary font-semibold">Available Credit: Rs. 2,000</p>
              </div>
            </div>
            <button className="text-xs font-bold text-white bg-primary px-4 py-2 rounded-full hover:bg-secondary">Use Now</button>
          </div>
        </section>

        {/* BEGIN: CategoryPills (Dynamic) */}
        <section className="px-4">
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
            {isCatLoading ? (
              [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-9 min-w-[100px] rounded-full" />)
            ) : (
              categories?.slice(0, 8).map((cat, index) => (
                <button 
                  key={cat.id}
                  onClick={() => navigate(`/category/${cat.slug}`)}
                  className={`px-6 py-2 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm transition-colors border ${
                    index === 0 
                      ? 'bg-primary text-white border-transparent' 
                      : 'bg-white text-muted border-gray-100 hover:text-primary hover:border-primary/30'
                  }`}
                >
                  {cat.name}
                </button>
              ))
            )}
          </div>
        </section>

        {/* BEGIN: TodaysOffers (Dynamic Products) */}
        <section className="pl-4">
          <div className="flex items-center justify-between pr-4 mb-4">
            <h3 className="text-lg font-bold text-textMain tracking-tight">Today's Offers</h3>
            <button onClick={() => navigate('/category/all')} className="text-sm font-semibold text-primary">View All</button>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {isTrendLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="min-w-[160px] h-48 rounded-premium" />)
            ) : trendingProducts?.map((product) => (
              <div 
                key={product.id} 
                onClick={() => navigate(`/product/${product.slug}`)}
                className="min-w-[160px] bg-white rounded-premium p-3 border border-gray-100 relative shadow-sm cursor-pointer hover:shadow-md transition-shadow group flex flex-col"
              >
                {/* Discount Badge */}
                {product.compare_at_price > product.selling_price && (
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                    {Math.round(((product.compare_at_price - product.selling_price) / product.compare_at_price) * 100)}% OFF
                  </span>
                )}
                <div className="h-28 w-full mb-3 flex items-center justify-center p-2">
                  <img alt={product.name} className="max-h-full object-contain group-hover:scale-105 transition-transform" src={product.primary_image_url || "/placeholder.svg"} />
                </div>
                <h4 className="text-xs font-bold text-textMain line-clamp-1">{product.name}</h4>
                <p className="text-[10px] text-muted mb-2">{product.unit || '1 Pack'}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <p className="text-sm font-bold text-primary">₹{product.selling_price}</p>
                    {product.compare_at_price > product.selling_price && (
                      <p className="text-[10px] text-muted line-through">₹{product.compare_at_price}</p>
                    )}
                  </div>
                  <button 
                    onClick={(e) => handleAddToCart(e, product)} 
                    className="bg-surface text-primary border border-primary/20 hover:bg-primary hover:text-white transition-colors text-[10px] font-bold px-3 py-1.5 rounded-lg"
                  >
                    + Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BEGIN: ShopByCategory (Dynamic Grid) */}
        <section className="px-4">
          <h3 className="text-lg font-bold text-textMain mb-4 tracking-tight">Shop by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories?.slice(0, 4).map((cat, i) => (
              <div 
                key={cat.id} 
                onClick={() => navigate(`/category/${cat.slug}`)}
                className={`${bgColors[i % 4]} p-4 rounded-premium h-36 flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow`}
              >
                <div className="relative z-10">
                  <h4 className={`text-sm font-bold ${textColors[i % 4]} leading-tight`}>{cat.name}</h4>
                  <p className={`text-[10px] ${subTextColors[i % 4]} font-medium mt-1`}>Shop Now</p>
                </div>
                {cat.image_url && (
                  <img alt={cat.name} className="absolute -right-2 -bottom-2 w-20 h-20 opacity-90 group-hover:scale-110 transition-transform object-contain drop-shadow-sm" src={cat.image_url} />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* BEGIN: CreditCardFeature */}
        <section className="px-4">
          <div className="bg-dark rounded-premium p-6 text-white shadow-lg">
            <h3 className="text-lg font-bold mb-6 tracking-tight">Introducing Ahmad Credit Card</h3>
            <div className="space-y-5 mb-8">
              {['Buy now, pay at month end', 'Zero interest', 'Accepted only at Ahmad Mart'].map((feature, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-white/90">{feature}</p>
                </div>
              ))}
            </div>
            <button className="w-full bg-primary hover:bg-secondary transition-colors text-white font-bold py-4 rounded-premium text-sm">Activate Your Card</button>
          </div>
        </section>

        {/* BEGIN: OrderAgain (Dynamic using Featured Products as placeholder) */}
        <section className="pl-4">
          <h3 className="text-lg font-bold text-textMain mb-4 tracking-tight">Order Again</h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {isFeatLoading ? (
               [1, 2, 3].map((i) => <Skeleton key={i} className="min-w-[130px] h-[58px] rounded-xl" />)
            ) : featuredProducts?.map((product) => (
              <div 
                key={product.id} 
                onClick={() => navigate(`/product/${product.slug}`)}
                className="min-w-[150px] flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-primary/30 transition-colors"
              >
                <img alt={product.name} className="w-10 h-10 object-contain" src={product.primary_image_url || "/placeholder.svg"} />
                <div className="flex-1">
                  <p className="text-[10px] font-bold line-clamp-1">{product.name}</p>
                  <p className="text-[10px] text-primary font-bold">₹{product.selling_price}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BEGIN: TrustFooter */}
        <footer className="px-4 py-8 text-center bg-transparent">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">100% Fresh</span>
            <span className="text-muted text-[10px]">•</span>
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Local Delivery</span>
            <span className="text-muted text-[10px]">•</span>
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Ambur's Own</span>
          </div>
          <p className="text-xs text-muted/60 font-medium">© 2024 Ahmad Mart Hyperlocal</p>
        </footer>
      </div>
    </CustomerLayout>
  );
};

export default HomePage;
