import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, Plus, Minus, ShoppingBag, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAllCategories, useSubcategories } from '@/hooks/useCategories';
import type { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type Product = Database['public']['Tables']['products']['Row'];

const AllCategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { addItem, incrementQuantity, decrementQuantity, getItemQuantity, getTotalItems, getTotalAmount } = useCartStore();

  const cartItemsCount = getTotalItems();
  const cartTotal = getTotalAmount();

  // Fetch all root categories for the horizontal bar
  const { data: allCategories, isLoading: categoriesLoading } = useAllCategories();
  const rootCategories = allCategories?.filter(c => !c.parent_id) || [];

  // DEFAULT TO 'null' WHICH REPRESENTS THE "ALL" CATEGORY
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const activeCategory = rootCategories.find(c => c.id === activeCategoryId);

  // Fetch subcategories of the active category
  const { data: subcategories } = useSubcategories(activeCategoryId || undefined);

  // Fetch LIMITED products for the active category (Max 8 products)
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['preview-products', activeCategoryId, subcategories?.map(s => s.id)],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, vendor:vendors(business_name)')
        .eq('status', 'active');

      if (activeCategoryId) {
        if (subcategories && subcategories.length > 0) {
          const allIds = [activeCategoryId, ...subcategories.map(s => s.id)];
          query = query.in('category_id', allIds);
        } else {
          query = query.eq('category_id', activeCategoryId);
        }
      }

      // Limit to 8 products, sort by newest for the "All" view
      const { data, error } = await query.limit(8).order('created_at', { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
    enabled: true, 
  });

  const isLoading = categoriesLoading || productsLoading;

  const handleAddToCart = (product: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
    });
    toast.success('Item added to cart');
  };

  return (
    <CustomerLayout hideHeader={true}>
      {/* To get the exact fonts to render perfectly, ensure you add this to your public/index.html <head>:
        <link href="https://fonts.googleapis.com/css2?family=Epilogue:wght@400;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      */}
      <div className="bg-[#f6faf4] text-[#181d19] min-h-screen pb-32 font-['Plus_Jakarta_Sans',sans-serif]">
        
        {/* Glassmorphic TopAppBar */}
        <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-[#f6faf4]/70 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="hover:bg-[#a3f788]/20 transition-colors p-2 -ml-2 rounded-full flex items-center justify-center scale-95 duration-200"
            >
              <ArrowLeft className="text-[#0d5200] w-6 h-6" />
            </button>
            <h1 className="font-bold text-xl font-['Epilogue',sans-serif] tracking-tight text-[#0d5200]">
              {activeCategory ? activeCategory.name : 'All Categories'}
            </h1>
          </div>
          <button 
            onClick={() => navigate('/search')}
            className="hover:bg-[#a3f788]/20 transition-colors p-2 -mr-2 rounded-full flex items-center justify-center scale-95 duration-200"
          >
            <Search className="text-[#0d5200] w-6 h-6" />
          </button>
        </header>

        <main className="pt-20 px-6 max-w-[1400px] mx-auto">
          
          {/* Promotional Banner - Shown only on "All" view */}
          {activeCategoryId === null && (
            <section className="mt-4 relative overflow-hidden rounded-[2rem] bg-[#1d6c0a] text-[#98eb7d] p-6 flex flex-col md:flex-row justify-between items-center min-h-[180px] shadow-sm">
              <div className="z-10 flex-1 w-full">
                <span className="text-xs font-bold text-white uppercase tracking-widest opacity-80 mb-2 block">Exclusive Offer</span>
                <h2 className="text-3xl font-black text-white leading-tight mb-2 font-['Epilogue',sans-serif]">10% OFF Fresh Produce</h2>
                <p className="text-sm font-medium text-white opacity-90 max-w-[200px] mb-4">Straight from the Ambur fields to your doorstep.</p>
                <button 
                  onClick={() => navigate('/search')}
                  className="bg-[#ffffff] text-[#0d5200] px-6 py-2 rounded-full font-bold text-sm shadow-sm hover:bg-[#f6faf4] transition-colors"
                >
                  Shop Now
                </button>
              </div>
              <div className="absolute right-0 top-0 h-full w-1/2 overflow-hidden pointer-events-none hidden sm:block">
                {/* Fallback pattern/image if no actual organic image exists */}
                <div className="w-full h-full bg-[#0d5200]/20 transform scale-110 rotate-3 backdrop-blur-sm rounded-l-full"></div>
              </div>
              {/* Glass Overlay Shape */}
              <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-[#a3f788]/20 blur-3xl rounded-full"></div>
            </section>
          )}

          {/* Category Chips (Horizontal Scroll) */}
          <section className="flex gap-3 overflow-x-auto py-8 no-scrollbar -mx-6 px-6">
            {categoriesLoading ? (
              [...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-28 rounded-xl shrink-0" />)
            ) : (
              <>
                <button
                  onClick={() => setActiveCategoryId(null)}
                  className={cn(
                    'px-6 py-2.5 rounded-xl font-semibold whitespace-nowrap text-sm transition-all duration-200',
                    activeCategoryId === null
                      ? 'bg-[#1d6c0a] text-[#ffffff] shadow-sm'
                      : 'bg-[#dfe4de] text-[#40493b] hover:bg-[#e5e9e3] font-medium'
                  )}
                >
                  All
                </button>
                {rootCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={cn(
                      'px-6 py-2.5 rounded-xl font-semibold whitespace-nowrap text-sm transition-all duration-200',
                      activeCategoryId === cat.id
                        ? 'bg-[#1d6c0a] text-[#ffffff] shadow-sm'
                        : 'bg-[#dfe4de] text-[#40493b] hover:bg-[#e5e9e3] font-medium'
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </>
            )}
          </section>

          {/* Product Grid (Asymmetric Editorial Style) */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={cn("group relative flex flex-col", i % 2 !== 0 ? "pt-12" : "pt-4")}>
                  <Skeleton className="w-full aspect-[4/5] rounded-[1.5rem]" />
                  <div className="mt-2 px-1">
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
              {products.map((product, i) => {
                const qty = getItemQuantity(product.id);
                const displayPrice = product.admin_selling_price ?? product.selling_price;
                const isOutOfStock = (product.stock_quantity ?? 0) <= 0 || product.status === 'out_of_stock';
                
                // Asymmetric staggering: alternating columns push down
                const isStaggered = i % 2 !== 0;

                return (
                  <div key={product.id} className={cn("group relative flex flex-col cursor-pointer", isStaggered ? "pt-12" : "pt-4", isOutOfStock && "opacity-60 grayscale-[30%]")} onClick={() => navigate(`/product/${product.slug}`)}>
                    
                    {/* Image Box */}
                    <div className="relative bg-[#ffffff] rounded-[1.5rem] aspect-[4/5] p-4 transition-transform group-hover:-translate-y-2 duration-300 shadow-sm overflow-hidden flex items-center justify-center">
                      
                      {/* Product Label (Optional, showing logic based on index or discount) */}
                      {product.mrp > displayPrice && (
                         <div className="absolute top-4 left-4 z-10 bg-[#a0346e] text-[#ffc8de] text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-tighter shadow-sm">
                           Save ₹{product.mrp - displayPrice}
                         </div>
                      )}

                      <img 
                        src={product.primary_image_url || '/placeholder.svg'} 
                        alt={product.name} 
                        className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-500" 
                      />

                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                          <span className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">Out of Stock</span>
                        </div>
                      )}

                      {/* Floating Add/Qty Button */}
                      {!isOutOfStock && (
                        qty === 0 ? (
                          <button 
                            onClick={(e) => handleAddToCart(product, e)} 
                            className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-gradient-to-br from-[#0d5200] to-[#1d6c0a] text-white flex items-center justify-center shadow-md scale-90 hover:scale-100 active:scale-110 transition-transform z-20"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        ) : (
                          <div 
                            className="absolute bottom-4 right-4 h-10 bg-gradient-to-br from-[#0d5200] to-[#1d6c0a] text-white rounded-full flex items-center shadow-md z-20 px-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button 
                              className="w-8 h-full flex items-center justify-center hover:bg-white/10 rounded-l-full transition-colors" 
                              onClick={() => decrementQuantity(product.id)}
                            >
                              <Minus className="w-4 h-4"/>
                            </button>
                            <span className="text-sm font-bold w-5 text-center">{qty}</span>
                            <button 
                              className="w-8 h-full flex items-center justify-center hover:bg-white/10 rounded-r-full transition-colors" 
                              onClick={() => incrementQuantity(product.id)}
                            >
                              <Plus className="w-4 h-4"/>
                            </button>
                          </div>
                        )
                      )}
                    </div>

                    {/* Details */}
                    <div className="mt-3 px-1 flex-1 flex flex-col">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-[#181d19] leading-tight truncate font-['Epilogue',sans-serif]">{product.name}</h3>
                          <p className="text-xs text-[#40493b] mt-0.5 truncate">{product.unit_value} {product.unit_type} · {product.vendor?.business_name || 'Ambur Farms'}</p>
                        </div>
                        <p className="font-black text-[#0d5200] shrink-0">₹{displayPrice}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="w-20 h-20 bg-[#ffffff] rounded-3xl flex items-center justify-center mb-4 shadow-sm">
                <ShoppingBag className="w-8 h-8 text-[#a3f788]" />
              </div>
              <p className="font-bold text-xl text-[#181d19] font-['Epilogue',sans-serif]">It's empty here</p>
              <p className="text-sm text-[#40493b] mt-1">
                {activeCategory ? `No fresh items found in ${activeCategory.name}.` : 'No fresh items available at the moment.'}
              </p>
            </div>
          )}

          {/* View All Products Button (If not on the root "All" page) */}
          {!isLoading && products && products.length > 0 && activeCategoryId !== null && (
            <div className="py-12 flex justify-center">
              <button 
                onClick={() => activeCategory ? navigate(`/category/${activeCategory.slug}`) : navigate('/search')} 
                className="w-full md:w-auto md:px-12 bg-transparent border-2 border-[#1d6c0a] text-[#1d6c0a] hover:bg-[#a3f788]/10 font-bold py-4 rounded-full text-sm shadow-sm transition-all tracking-wide"
              >
                {activeCategory ? `Explore All in ${activeCategory.name}` : 'Explore All Items'}
              </button>
            </div>
          )}
        </main>

        {/* Glassmorphic Basket Float (Replaces the standard floating cart) */}
        {cartItemsCount > 0 && (
          <div 
            onClick={() => navigate('/cart')}
            className="fixed bottom-[85px] lg:bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40 bg-[#181d19]/95 backdrop-blur-md rounded-full px-5 py-3 flex items-center justify-between shadow-xl cursor-pointer hover:scale-[1.02] transition-transform duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#a3f788] rounded-full flex items-center justify-center shadow-inner">
                <ShoppingBag className="text-[#0d5200] w-4 h-4" />
              </div>
              <span className="text-[#f6faf4] font-semibold text-sm">
                {cartItemsCount} {cartItemsCount === 1 ? 'Item' : 'Items'} added
              </span>
            </div>
            <div className="flex items-center gap-2 pl-4 border-l border-white/10">
              <span className="text-[#f6faf4] font-black text-lg">₹{cartTotal.toFixed(0)}</span>
              <ChevronRight className="text-[#a3f788] w-5 h-5" />
            </div>
          </div>
        )}

      </div>
    </CustomerLayout>
  );
};

export default AllCategoriesPage;
