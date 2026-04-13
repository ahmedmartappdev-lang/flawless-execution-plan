import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Minus } from 'lucide-react';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { useCategories } from '@/hooks/useCategories';
import { useFeaturedProducts, useSearchProducts } from '@/hooks/useProducts';
import { useFeaturedStores } from '@/hooks/useFeaturedStores';
import { useBanners } from '@/hooks/useBanners';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';

import { useCustomerCredits } from '@/hooks/useCustomerCredits';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchResultsSection } from '@/components/customer/home/SearchResultsSection';
import { AppInstallBanner } from '@/components/customer/home/AppInstallBanner';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const searchQuery = (searchParams.get('q') || '').trim();

  // Backend Integration Hooks
  const { data: categories, isLoading: isCatLoading } = useCategories();
  const { data: featuredProducts, isLoading: isFeatLoading } = useFeaturedProducts();
  const { data: banners } = useBanners();
  const { data: searchResults, isLoading: isSearchLoading } = useSearchProducts(searchQuery);
  const { addItem, getItemQuantity, incrementQuantity, decrementQuantity } = useCartStore();
  const { data: featuredStores, isLoading: isStoresLoading } = useFeaturedStores();

  // Get user auth state & credits
  const { user } = useAuthStore();
  const { creditBalance } = useCustomerCredits();

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    addItem({
      id: product.id,
      product_id: product.id,
      name: product.name,
      image_url: product.primary_image_url || '/placeholder.svg',
      unit_value: product.unit_value || 1,
      unit_type: product.unit_type,
      selling_price: product.admin_selling_price ?? product.selling_price,
      mrp: product.mrp,
      max_quantity: product.max_order_quantity || 10,
      vendor_id: product.vendor_id,
      vendor_name: product.vendor?.business_name || undefined,
      stock_quantity: product.stock_quantity,
    });
    toast({
      title: 'Added to cart',
      description: `${product.name} added to your cart.`,
      duration: 2000,
    });
  };

  return (
    <CustomerLayout hideHeader={false}>
      <div className="bg-white min-h-screen pb-24 font-sans">
        
        <div className="space-y-6 md:pt-4">
          {searchQuery ? (
            <SearchResultsSection
              searchQuery={searchQuery}
              searchResults={searchResults}
              isLoading={isSearchLoading}
            />
          ) : (
            <>
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
                    <div
                      onClick={() => {
                        if (!user) {
                          navigate('/auth');
                        } else {
                          navigate('/credit-apply');
                        }
                      }}
                      className="min-w-[85vw] md:min-w-[400px] snap-center bg-dark rounded-premium p-6 text-white flex flex-col justify-between h-44 relative overflow-hidden cursor-pointer"
                    >
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
                  <div className="bg-card p-4 rounded-premium border border-border flex items-center justify-between shadow-sm cursor-pointer hover:border-primary/30 transition-colors">
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

              {/* BEGIN: Top Picks For You (Vendors) */}
              <section className="px-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[16px] font-bold text-foreground tracking-tight">Top Picks For You</h3>
                </div>
                <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2">
                  {isStoresLoading ? (
                    [1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex flex-col items-center flex-shrink-0">
                        <Skeleton className="w-[72px] h-[72px] rounded-full" />
                        <Skeleton className="h-3 w-16 mt-2 rounded" />
                      </div>
                    ))
                  ) : (
                    featuredStores?.map((store) => (
                      <div key={store.id} className="flex flex-col items-center flex-shrink-0 cursor-pointer group" onClick={() => navigate(`/store/${store.id}`)}>
                        <div className="w-[72px] h-[72px] rounded-full bg-muted/60 overflow-hidden flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200 border border-gray-100">
                          {store.store_photo_url || store.owner_photo_url ? (
                            <img
                              src={store.store_photo_url || store.owner_photo_url || ''}
                              alt={store.business_name}
                              className="w-full h-full object-cover scale-110"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                              {store.business_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <p className="mt-1.5 text-[11px] font-semibold text-foreground text-center w-[76px] truncate">
                          {store.business_name}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* BEGIN: ShopByCategory */}
              <section className="px-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-bold text-foreground tracking-tight">Shop by Category</h3>
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
                        className="relative p-4 rounded-[16px] h-36 flex flex-col justify-start overflow-hidden group cursor-pointer border border-gray-100/50 shadow-sm bg-white"
                      >
                        {/* Background Image Setup */}
                        <div className="absolute inset-0 w-full h-full bg-gray-50">
                          <img
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            src={cat.image_url || '/placeholder.svg'}
                          />
                          {/* Dark gradient overlay for text readability */}
                          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent"></div>
                        </div>

                        <div className="relative z-10">
                          <h4 className="text-[13px] font-bold text-white leading-tight drop-shadow-sm">{cat.name}</h4>
                          <p className="text-[10px] text-white/90 font-medium mt-0.5">Explore items</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* BEGIN: Featured Products (Vertical List Layout) */}
              <section className="px-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-bold text-foreground tracking-tight">Featured Products</h3>
                  <button onClick={() => navigate('/category/all')} className="text-[13px] font-semibold text-primary">View All</button>
                </div>
                <div className="flex flex-col gap-3">
                  {isFeatLoading ? (
                    [1, 2, 3, 4].map((i) => <Skeleton key={i} className="w-full h-[88px] rounded-[16px]" />)
                  ) : featuredProducts?.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => navigate(`/product/${product.slug}`)}
                      className="bg-white border border-gray-100 rounded-[16px] p-3 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all duration-200"
                    >
                      {/* Product Image Square */}
                      <div className="h-[72px] w-[72px] rounded-[12px] bg-[#f9f9f9] flex items-center justify-center shrink-0 overflow-hidden border border-gray-50">
                        <img
                          alt={product.name}
                          className="w-full h-full object-cover"
                          src={product.primary_image_url || '/placeholder.svg'}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 py-1">
                        <h4 className="text-[13px] font-bold text-foreground truncate">{product.name}</h4>
                        <p className="text-[11px] text-muted-foreground mb-1">{product.unit_value ? `${product.unit_value} ${product.unit_type}` : '1 unit'}</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-extrabold text-foreground">₹{product.admin_selling_price ?? product.selling_price}</p>
                          {product.mrp > (product.admin_selling_price ?? product.selling_price) && (
                            <p className="text-[11px] text-muted-foreground line-through">₹{product.mrp}</p>
                          )}
                        </div>
                      </div>

                      {/* Add / Quantity Button */}
                      <div className="shrink-0 pr-1" onClick={(e) => e.stopPropagation()}>
                        {getItemQuantity(product.id) === 0 ? (
                          <button
                            onClick={(e) => handleAddToCart(e, product)}
                            className="bg-white text-[#2e7d32] border border-gray-200 hover:bg-gray-50 transition-colors text-[12px] font-bold px-4 py-1.5 rounded-md shadow-sm"
                          >
                            + ADD
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 border border-gray-200 rounded-md p-0.5 h-[32px] bg-white">
                            <button
                              onClick={() => decrementQuantity(product.id)}
                              className="w-7 h-full flex items-center justify-center text-gray-400 font-bold hover:text-gray-600"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[13px] font-bold text-foreground min-w-[12px] text-center">
                              {getItemQuantity(product.id)}
                            </span>
                            <button
                              onClick={() => incrementQuantity(product.id)}
                              className="w-7 h-full flex items-center justify-center text-[#2e7d32] font-bold hover:text-green-800"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* BEGIN: Bottom Banners */}
              <div className="mt-8 space-y-4">

                {/* SEARCH PROMPT BANNER (Matches your HTML/CSS snippet) */}
                <div className="mx-4 md:hidden">
                  <div className="w-full bg-white p-[25px_25px] border border-gray-200 rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.03)]">
                    {/* Headline */}
                    <h2 className="text-[#949494] text-[30px] font-extrabold leading-[1.15] mb-[25px] tracking-tight">
                      Didn't Find<br/>What You Were<br/>Looking For?
                    </h2>
                    
                    {/* Action Button */}
                    <button 
                      onClick={() => navigate('/category/all')}
                      className="bg-[#1a7d1a] text-white border-none py-[12px] px-[28px] rounded-lg text-[14px] font-bold cursor-pointer mb-[40px] hover:opacity-90 transition-opacity"
                    >
                      Search Products
                    </button>

                    {/* Graphic and Tagline Row */}
                    <div className="flex items-end justify-between">
                      {/* SVG Container */}
                      <div className="w-[170px] -ml-[10px]">
                        <svg className="w-full h-auto block" viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg">
                          {/* Ground/Shadow line */}
                          <rect x="20" y="132" width="140" height="2" fill="#e0e0e0" rx="1"/>
                          
                          {/* Yellow Scooter (Vespa Style) */}
                          <path d="M40 115 Q40 125 60 125 L120 125 Q135 125 135 110 L125 80 L50 80 Z" fill="#FFD700" />
                          <path d="M120 125 L150 125 L140 65 Q138 55 125 55 L115 55 Z" fill="#FFC107" />
                          <rect x="85" y="120" width="30" height="3" fill="#333" fillOpacity="0.2"/>
                          
                          {/* Wheels */}
                          <circle cx="60" cy="122" r="16" fill="#333" stroke="white" strokeWidth="4"/>
                          <circle cx="128" cy="122" r="16" fill="#333" stroke="white" strokeWidth="4"/>
                          <circle cx="60" cy="122" r="6" fill="#999" />
                          <circle cx="128" cy="122" r="6" fill="#999" />

                          {/* Delivery Box */}
                          <rect x="35" y="65" width="42" height="42" rx="3" fill="#FFD700" stroke="#E6B800" strokeWidth="1"/>
                          <line x1="35" y1="75" x2="77" y2="75" stroke="#E6B800" strokeWidth="1" />

                          {/* Delivery Rider */}
                          <path d="M85 90 L115 90 L110 115 L90 115 Z" fill="#3F51B5" />
                          <path d="M80 65 Q100 62 110 65 L115 95 L80 95 Z" fill="#4CAF50" />
                          <circle cx="102" cy="48" r="13" fill="#03A9F4" />
                          <path d="M102 48 M115 48 A13 13 0 0 1 102 61 L102 48 Z" fill="#FFE0B2" />
                          <path d="M105 75 L135 72" stroke="#2E7D32" strokeWidth="5" strokeLinecap="round" />
                          
                          {/* Wind/Speed Lines */}
                          <g stroke="#eee" strokeWidth="2" strokeLinecap="round">
                              <line x1="155" y1="85" x2="180" y2="85" />
                              <line x1="160" y1="100" x2="190" y2="100" />
                          </g>
                        </svg>
                      </div>

                      {/* Tagline */}
                      <div className="text-[#144d14] text-[24px] font-extrabold leading-[1.25] text-right pb-[10px]">
                        Fresh &<br/>Fast
                      </div>
                    </div>
                  </div>
                </div>

                {/* FREE HOME DELIVERY BANNER (Matches Grocery Bag Layout) */}
                <div className="mx-4 md:hidden mb-2 mt-4">
                  <div className="bg-gradient-to-r from-[#ff914d] to-[#ffbc6d] rounded-[16px] h-[110px] relative flex items-center justify-between pl-5 pr-4 shadow-sm overflow-visible border border-[#ff914d]/20">
                    
                    {/* Left Content (Offer Pill & Discount Text) */}
                    <div className="text-white z-10 flex flex-col justify-center pb-1">
                        <span className="bg-[#1e88e5] text-[10px] font-extrabold px-2.5 py-[3px] rounded shadow-sm w-fit uppercase tracking-wider">
                          Upto
                        </span>
                        <div className="text-[28px] font-black mt-1 leading-none drop-shadow-sm tracking-tight">
                          10% OFF
                        </div>
                    </div>

                    {/* Middle Text (Free Home Delivery) */}
                    <div className="text-right text-white font-extrabold leading-[1.15] text-[15px] z-10 drop-shadow-sm absolute right-[115px]">
                        FREE<br/>HOME<br/>DELIVERY
                    </div>

                    {/* Right Graphic (3D Grocery Bag) */}
                    {/* Sourced generic 3D grocery paper bag image overlapping the container */}
                    <div className="absolute right-[5px] bottom-0 w-[100px] h-[125px] z-20 pointer-events-none">
                        <img 
                          src="https://cdn-icons-png.flaticon.com/512/3081/3081840.png" 
                          alt="Fresh Groceries" 
                          className="w-full h-full object-contain object-bottom drop-shadow-xl"
                        />
                    </div>
                    
                  </div>
                </div>

                {/* App Install Banner */}
                <div className="md:hidden mt-4">
                  <AppInstallBanner />
                </div>

              </div>

              {/* BEGIN: TrustFooter */}
              <footer className="px-4 py-6 text-center mt-2 border-t border-gray-50 pt-8">
                <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 mb-3">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">100% Fresh Guarantee</span>
                  <span className="text-muted-foreground text-[10px]">•</span>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Local Delivery</span>
                  <span className="text-muted-foreground text-[10px]">•</span>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Ambur's Own Store</span>
                </div>
                <p className="text-[10px] text-muted-foreground/70 font-medium">© {new Date().getFullYear()} Ahmad Mart Hyperlocal Services</p>
              </footer>
            </>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default HomePage;
