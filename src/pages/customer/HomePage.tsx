import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { useCategories } from '@/hooks/useCategories';
import { useFeaturedProducts } from '@/hooks/useProducts';
import { useBanners } from '@/hooks/useBanners';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useCustomerCredits } from '@/hooks/useCustomerCredits';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Backend Integration Hooks
  const { data: categories, isLoading: isCatLoading } = useCategories();
  const { data: featuredProducts, isLoading: isFeatLoading } = useFeaturedProducts();
  const { data: banners } = useBanners();
  const addItem = useCartStore((state) => state.addItem);
  
  // Get user auth state & credits
  const { user } = useAuthStore();
  const { creditBalance } = useCustomerCredits();

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    addItem({ ...product, quantity: 1 });
    toast({
      title: "Added to cart",
      description: `${product.name} added to your cart.`,
      duration: 2000,
    });
  };

  return (
    <CustomerLayout>
      <div className="space-y-6 bg-[#f5f9f3] min-h-screen pb-24 font-sans max-w-[1280px] mx-auto md:pt-4">
        
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
              <div className="min-w-[85vw] md:min-w-[400px] snap-center bg-dark rounded-premium p-6 text-white flex flex-col justify-between h-44 relative overflow-hidden">
                <div className="z-10">
                  <h3 className="text-xl font-bold leading-tight tracking-tight">Shop Now.<br />Pay Later.</h3>
                  <p className="text-xs text-white/70 mt-1">With Ahmad Credit Card</p>
                </div>
                <button className="bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-full w-max z-10">Apply Now</button>
                <div className="absolute -right-4 -bottom-4 w-32 h-20 bg-primary/20 rounded-lg rotate-12 border border-white/10"></div>
                <div className="absolute -right-2 -bottom-2 w-32 h-20 bg-primary/40 rounded-lg rotate-6 border border-white/20"></div>
              </div>
            )}
          </div>
        </section>

        {/* BEGIN: CreditStrip - ONLY SHOW IF LOGGED IN */}
        {user && (
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
                  <p className="text-xs text-primary font-semibold">Available Credit: ₹{creditBalance || 0}</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/profile')}
                className="text-xs font-bold text-white bg-primary px-4 py-2 rounded-full hover:bg-secondary"
              >
                Use Now
              </button>
            </div>
          </section>
        )}

        {/* BEGIN: CategoryPills */}
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

        {/* BEGIN: ShopByCategory (Exact Image Layout) */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-bold text-[#111111] tracking-tight">Shop by Category</h3>
            <button onClick={() => navigate('/category/all')} className="text-[13px] font-semibold text-primary">View All</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {isCatLoading ? (
               [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-[16px]" />)
            ) : (
               categories?.slice(0, 4).map((cat) => (
                <div 
                  key={cat.id} 
                  onClick={() => navigate(`/category/${cat.slug}`)}
                  className="relative p-4 rounded-[16px] h-36 flex flex-col justify-start overflow-hidden group cursor-pointer border border-gray-100/50 shadow-sm"
                >
                  {/* Background Image Setup */}
                  <div className="absolute inset-0 w-full h-full bg-gray-200">
                    <img 
                      alt={cat.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      src={cat.image_url || "/placeholder.svg"} 
                    />
                    {/* Dark gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent"></div>
                  </div>
                  
                  <div className="relative z-10">
                    <h4 className="text-[13px] font-bold text-white leading-tight drop-shadow-sm">{cat.name}</h4>
                    {/* Mock text for items count as per design snippet */}
                    <p className="text-[10px] text-white/90 font-medium mt-0.5">120+ items</p> 
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* BEGIN: Featured Products (Vertical List Layout) */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-bold text-[#111111] tracking-tight">Featured Products</h3>
            <button onClick={() => navigate('/category/all')} className="text-[13px] font-semibold text-primary">View All</button>
          </div>
          <div className="flex flex-col gap-3">
            {isFeatLoading ? (
               [1, 2, 3, 4].map((i) => <Skeleton key={i} className="w-full h-[88px] rounded-[16px]" />)
            ) : featuredProducts?.map((product) => (
              <div 
                key={product.id} 
                onClick={() => navigate(`/product/${product.slug}`)}
                className="bg-white rounded-[16px] p-3 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all duration-200"
              >
                {/* Product Image Square */}
                <div className="h-[72px] w-[72px] rounded-[12px] bg-gray-50 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                  <img 
                    alt={product.name} 
                    className="max-h-full max-w-full object-contain mix-blend-multiply" 
                    src={product.primary_image_url || "/placeholder.svg"} 
                  />
                </div>
                
                {/* Product Details */}
                <div className="flex-1 min-w-0 py-1">
                  <h4 className="text-[13px] font-bold text-[#111111] truncate">{product.name}</h4>
                  <p className="text-[11px] text-[#6b7c6a] mb-1">{product.unit_value ? `${product.unit_value} ${product.unit_type}` : '1 unit'}</p>
                  <p className="text-[13px] font-bold text-primary">₹{product.selling_price}</p>
                </div>
                
                {/* Add Button */}
                <div className="shrink-0 pr-1">
                  <button 
                    onClick={(e) => handleAddToCart(e, product)} 
                    className="bg-[#f5f9f3] text-primary border border-primary/20 hover:bg-primary hover:text-white transition-colors text-[11px] font-bold px-4 py-1.5 rounded-[8px]"
                  >
                    + Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BEGIN: TrustFooter (Matching the screenshot) */}
        <footer className="px-4 py-6 text-center mt-2">
          <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 mb-3">
            <span className="text-[9px] font-bold text-[#6b7c6a] uppercase tracking-wider">100% Fresh Guarantee</span>
            <span className="text-[#6b7c6a] text-[10px]">•</span>
            <span className="text-[9px] font-bold text-[#6b7c6a] uppercase tracking-wider">Local Delivery</span>
            <span className="text-[#6b7c6a] text-[10px]">•</span>
            <span className="text-[9px] font-bold text-[#6b7c6a] uppercase tracking-wider">Ambur's Own Store</span>
          </div>
          <p className="text-[10px] text-[#6b7c6a]/70 font-medium">© 2024 Ahmad Mart Hyperlocal Services</p>
        </footer>
      </div>
    </CustomerLayout>
  );
};

export default HomePage;
