import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Minus } from 'lucide-react';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { useCategories } from '@/hooks/useCategories';
import { useFeaturedProducts, useSearchProducts, useHomeCategorySections } from '@/hooks/useProducts';
import { useFeaturedStores } from '@/hooks/useFeaturedStores';
import { useBanners } from '@/hooks/useBanners';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';

import { useCustomerCredits } from '@/hooks/useCustomerCredits';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchResultsSection } from '@/components/customer/home/SearchResultsSection';
import { AppInstallBanner } from '@/components/customer/home/AppInstallBanner';
import { CategoryProductRow } from '@/components/customer/home/CategoryProductRow';

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
  const { data: homeSections, isLoading: isHomeSectionsLoading } = useHomeCategorySections();

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
                  
                  {/* Dynamic Banners */}
                  {banners?.map((banner) => (
                    <div
                      key={banner.id}
                      onClick={() => banner.link_url && navigate(banner.link_url)}
                      className="min-w-[85vw] md:min-w-[400px] snap-center bg-dark rounded-2xl p-6 text-white flex flex-col justify-between h-44 relative overflow-hidden cursor-pointer transition-transform active:scale-[0.99]"
                    >
                      {banner.image_url && (
                        <img src={banner.image_url} alt={banner.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                      )}
                      <div className="z-10 relative">
                        <h3 className="text-xl font-bold leading-tight tracking-tight">{banner.title}</h3>
                      </div>
                    </div>
                  ))}

                  {/* Shop Now. Pay Later. Banner - Always Visible */}
                  <div
                    onClick={() => {
                      if (!user) {
                        navigate('/auth');
                      } else {
                        navigate('/credit-apply');
                      }
                    }}
                    className="min-w-[85vw] md:min-w-[400px] snap-center bg-gradient-to-br from-[#f4fcf6] to-[#e6f7eb] border border-[#d2f0df] rounded-2xl p-6 flex flex-col justify-between h-44 relative overflow-hidden cursor-pointer transition-transform active:scale-[0.99]"
                  >
                    <div className="z-10 relative">
                      <h3 className="text-xl font-extrabold leading-tight tracking-tight text-gray-900">Shop Now.<br />Pay Later.</h3>
                      <p className="text-xs text-gray-600 mt-1.5 font-medium">With Ahmad Credit Card</p>
                    </div>
                    <button className="bg-primary text-white text-xs font-semibold h-9 px-5 rounded-full w-max z-10 shadow-sm hover:bg-primary/90 transition-colors">Apply Now</button>

                    {/* Subtle decorative shape (single, soft) */}
                    <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-primary/10 rounded-full blur-xl"></div>

                    {/* Credit Card Icon Top Right */}
                    <div className="absolute top-4 right-4 bg-white/90 p-2.5 rounded-full backdrop-blur-md">
                       <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                       </svg>
                    </div>
                  </div>

                </div>
              </section>

              {/* BEGIN: CreditStrip - ONLY SHOW IF LOGGED IN */}
              {user && (
                <section className="px-4 md:max-w-md">
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-primary/10 rounded-xl shrink-0">
                        <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-foreground truncate">Ahmad Credit Card Active</h4>
                        <p className="text-xs text-primary font-semibold truncate">₹{(creditBalance || 0).toLocaleString()} available</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/profile')}
                      className="text-xs font-semibold text-primary border border-primary/40 hover:bg-primary hover:text-primary-foreground transition-colors h-9 px-4 rounded-full shrink-0"
                    >
                      Use Now
                    </button>
                  </div>
                </section>
              )}

              {/* BEGIN: Top Picks For You (Vendors) — admin-controlled */}
              {(isStoresLoading || (featuredStores && featuredStores.length > 0)) && (
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
                          <div className="w-[72px] h-[72px] rounded-full bg-muted/40 overflow-hidden flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ring-1 ring-gray-100">
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
              )}

              {/* BEGIN: ShopByCategory */}
              <section className="px-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-bold text-foreground tracking-tight">Shop by Category</h3>
                  <button onClick={() => navigate('/category/all')} className="text-[13px] font-semibold text-primary">View All</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {isCatLoading ? (
                    [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
                  ) : (
                    categories?.slice(0, 4).map((cat) => (
                      <div
                        key={cat.id}
                        onClick={() => navigate(`/category/${cat.slug}`)}
                        className="relative p-4 rounded-2xl h-36 flex flex-col justify-start overflow-hidden group cursor-pointer border border-gray-100 bg-white transition-transform active:scale-[0.99]"
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
                <div className="flex flex-col gap-2.5">
                  {isFeatLoading ? (
                    [1, 2, 3, 4].map((i) => <Skeleton key={i} className="w-full h-[92px] rounded-2xl" />)
                  ) : featuredProducts?.map((product) => {
                    const qty = getItemQuantity(product.id);
                    const effectivePrice = product.admin_selling_price ?? product.selling_price;
                    return (
                      <div
                        key={product.id}
                        onClick={() => navigate(`/product/${product.slug}`)}
                        className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-colors hover:border-gray-200"
                      >
                        {/* Product Image */}
                        <div className="h-[68px] w-[68px] rounded-xl bg-[#f9f9f9] shrink-0 overflow-hidden">
                          <img
                            alt={product.name}
                            className="w-full h-full object-cover"
                            src={product.primary_image_url || '/placeholder.svg'}
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[13.5px] font-semibold text-foreground truncate leading-snug">{product.name}</h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{product.unit_value ? `${product.unit_value} ${product.unit_type}` : '1 unit'}</p>
                          <div className="flex items-baseline gap-1.5 mt-1">
                            <p className="text-sm font-extrabold text-foreground">₹{effectivePrice}</p>
                            {product.mrp > effectivePrice && (
                              <p className="text-[11px] text-muted-foreground line-through">₹{product.mrp}</p>
                            )}
                          </div>
                        </div>

                        {/* Add / Quantity Pill */}
                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                          {qty === 0 ? (
                            <button
                              onClick={(e) => handleAddToCart(e, product)}
                              className="bg-white text-primary border border-primary/40 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors text-[12px] font-bold tracking-wide h-9 px-5 rounded-full"
                            >
                              ADD
                            </button>
                          ) : (
                            <div className="flex items-center border border-primary rounded-full h-9 overflow-hidden">
                              <button
                                onClick={() => decrementQuantity(product.id)}
                                className="w-8 h-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                                aria-label="Decrease"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-[13px] font-bold text-primary min-w-[20px] text-center">{qty}</span>
                              <button
                                onClick={() => incrementQuantity(product.id)}
                                className="w-8 h-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                                aria-label="Increase"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* BEGIN: Per-category product rows (Blinkit-style) */}
              {isHomeSectionsLoading ? (
                <div className="space-y-6 px-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i}>
                      <Skeleton className="h-5 w-40 mb-3" />
                      <div className="flex gap-3 overflow-hidden">
                        {[1, 2, 3, 4].map((j) => (
                          <Skeleton key={j} className="w-[150px] h-[230px] rounded-2xl shrink-0" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {homeSections?.map((section) => (
                    <CategoryProductRow key={section.id} section={section} />
                  ))}
                </div>
              )}

              {/* BEGIN: Bottom Banners */}
              <div className="mt-8 space-y-4">
                
                {/* App Install Banner */}
                <div className="md:hidden">
                  <AppInstallBanner />
                </div>

                {/* Can't find it? — minimal CTA */}
                <div className="mx-4 md:hidden">
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-bold text-foreground tracking-tight">Can't find it?</h3>
                      <p className="text-[12px] text-muted-foreground mt-0.5">Browse our full catalogue.</p>
                    </div>
                    <button
                      onClick={() => navigate('/category/all')}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-[12px] font-semibold h-10 px-5 rounded-full shadow-sm shrink-0 whitespace-nowrap"
                    >
                      Browse all
                    </button>
                  </div>
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
