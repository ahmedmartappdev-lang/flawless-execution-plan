import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useCategories } from '@/hooks/useCategories';
import { useFeaturedProducts, useTrendingProducts, useSearchProducts } from '@/hooks/useProducts';
import { useBanners } from '@/hooks/useBanners';
import { Product } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { toast } from 'sonner';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  
  const { addItem, incrementQuantity, decrementQuantity, getItemQuantity } = useCartStore();

  // Fetch Data
  const { data: categories, isLoading: isCatLoading } = useCategories();
  const { data: featuredProducts, isLoading: isFeatLoading } = useFeaturedProducts();
  const { data: trendingProducts, isLoading: isTrendLoading } = useTrendingProducts();
  
  // Search Data
  const { data: searchResults, isLoading: isSearchLoading } = useSearchProducts(searchQuery);
  const { data: banners } = useBanners();

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
      <div className="border border-border rounded-xl p-3 relative bg-card hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
        {discount > 0 && (
          <div className="absolute top-0 left-[10px] bg-primary text-primary-foreground text-[10px] font-extrabold px-1.5 py-1 rounded-b-md z-10">
            {discount}% OFF
          </div>
        )}
        
        <div className="flex items-center justify-center mb-2 cursor-pointer py-2" onClick={() => navigate(`/product/${product.slug}`)}>
          <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border border-border">
            <img 
              src={product.primary_image_url || '/placeholder.svg'} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="bg-muted text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 w-fit mb-2">
          <Clock className="w-3 h-3" />
          15 MINS
        </div>

        <h3 className="text-[13px] font-semibold leading-[1.3] h-[34px] overflow-hidden mb-1 text-foreground line-clamp-2" title={product.name}>
          {product.name}
        </h3>

        <div className="text-[12px] text-muted-foreground mb-3">
          {product.unit_value} {product.unit_type}
        </div>

        <div className="mt-auto flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[13px] font-bold">₹{product.selling_price}</span>
            {product.mrp > product.selling_price && (
              <span className="text-[11px] text-muted-foreground line-through">₹{product.mrp}</span>
            )}
          </div>

          {qty === 0 ? (
            <button 
              className="border border-primary bg-primary/5 text-primary px-5 py-1.5 rounded-md font-bold text-[13px] hover:bg-primary hover:text-primary-foreground transition-colors uppercase"
              onClick={() => handleAddToCart(product)}
            >
              ADD
            </button>
          ) : (
            <div className="flex items-center bg-primary text-primary-foreground rounded-md h-[30px]">
              <button 
                className="px-2 h-full font-bold hover:bg-primary/90 rounded-l-md"
                onClick={() => decrementQuantity(product.id)}
              >
                -
              </button>
              <span className="px-1 text-[13px] font-bold min-w-[20px] text-center">{qty}</span>
              <button 
                className="px-2 h-full font-bold hover:bg-primary/90 rounded-r-md"
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
    <CustomerLayout hideBottomNav>
      <main className="max-w-[1280px] mx-auto p-5">
        
        {searchQuery ? (
          // SEARCH RESULTS VIEW
          <section className="mb-[50px]">
            <div className="flex items-center justify-between mb-[20px]">
              <div className="flex items-center gap-2">
                 <h2 className="text-[24px] font-bold text-foreground">Search Results</h2>
                 <span className="text-muted-foreground">for "{searchQuery}"</span>
              </div>
            </div>

            {isSearchLoading ? (
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[15px]">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-[240px] rounded-xl" />
                  ))}
               </div>
            ) : !searchResults || searchResults.length === 0 ? (
               <div className="text-center py-20 bg-muted/20 rounded-lg flex flex-col items-center justify-center">
                  <h3 className="text-xl font-bold mb-2">No results found</h3>
                  <p className="text-muted-foreground">Try checking your spelling or use different keywords.</p>
                  <button 
                    onClick={() => navigate('/')}
                    className="mt-4 text-primary font-bold hover:underline"
                  >
                    Clear Search
                  </button>
               </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[15px]">
                {searchResults.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        ) : (
          // STANDARD HOMEPAGE VIEW
          <>
            {/* HERO BANNER SECTION */}
            <section className="mb-8 rounded-2xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              {banners && banners.length > 0 ? (
                <img 
                  src={banners[0].image_url} 
                  alt={banners[0].title || 'Welcome to our store'} 
                  className="w-full h-auto object-cover min-h-[150px] md:min-h-[250px]"
                  onClick={() => banners[0].link_url && navigate(banners[0].link_url)}
                />
              ) : (
                <img 
                  src="/banner.jpg" 
                  alt="Welcome to our store" 
                  className="w-full h-auto object-cover min-h-[150px] md:min-h-[250px]" 
                />
              )}
            </section>
            
            {/* PROMO BANNERS */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-[15px] mb-10">
              <div className="bg-[#eef9f1] rounded-[16px] p-6 h-[180px] flex relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
                <div className="w-[65%] z-10">
                  <h2 className="text-[20px] font-extrabold mb-2 leading-[1.2]">Pharmacy at your doorstep!</h2>
                  <p className="text-[12px] mb-[15px] text-muted-foreground">Cough syrups, pain relief & more</p>
                  <button className="bg-foreground text-background px-4 py-2 rounded-md font-semibold text-[12px]">Order Now</button>
                </div>
                <img src="https://cdn-icons-png.flaticon.com/512/3028/3028560.png" className="absolute right-0 bottom-0 h-[90%] object-contain group-hover:scale-105 transition-transform" alt="Pharmacy" />
              </div>

              <div className="bg-[#fffce5] rounded-[16px] p-6 h-[180px] flex relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
                <div className="w-[65%] z-10">
                  <h2 className="text-[20px] font-extrabold mb-2 leading-[1.2]">Pet care supplies at your door</h2>
                  <p className="text-[12px] mb-[15px] text-muted-foreground">Food, treats, toys & more</p>
                  <button className="bg-foreground text-background px-4 py-2 rounded-md font-semibold text-[12px]">Order Now</button>
                </div>
                <img src="https://cdn-icons-png.flaticon.com/512/616/616408.png" className="absolute right-0 bottom-0 h-[90%] object-contain group-hover:scale-105 transition-transform" alt="Pet Care" />
              </div>

              <div className="bg-[#f1f7ff] rounded-[16px] p-6 h-[180px] flex relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
                <div className="w-[65%] z-10">
                  <h2 className="text-[20px] font-extrabold mb-2 leading-[1.2]">No time for a diaper run?</h2>
                  <p className="text-[12px] mb-[15px] text-muted-foreground">Get baby care essentials</p>
                  <button className="bg-foreground text-background px-4 py-2 rounded-md font-semibold text-[12px]">Order Now</button>
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
                      <div className="rounded-full aspect-square mb-2 flex items-center justify-center p-2.5 bg-muted group-hover:bg-muted/80 transition-colors overflow-hidden">
                        <img 
                          src={cat.image_url || cat.icon_url || '/placeholder.svg'} 
                          alt={cat.name} 
                          className="w-full h-full object-cover drop-shadow-sm"
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-foreground leading-[1.2] block truncate px-1">
                        {cat.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* FEATURED PRODUCTS */}
            <section className="mb-[50px]">
              <div className="flex justify-between items-center mb-[20px]">
                <h3 className="text-[24px] font-bold text-foreground">Featured Products</h3>
                <span className="text-primary font-bold text-[16px] cursor-pointer hover:underline">see all</span>
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

            {/* TRENDING PRODUCTS */}
            <section className="mb-[50px]">
              <div className="flex justify-between items-center mb-[20px]">
                <h3 className="text-[24px] font-bold text-foreground">Trending Now</h3>
                <span className="text-primary font-bold text-[16px] cursor-pointer hover:underline">see all</span>
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
          </>
        )}

      </main>
    </CustomerLayout>
  );
};

export default HomePage;
