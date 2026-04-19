import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, Plus, Minus, ShoppingCart, ChevronRight } from 'lucide-react';
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

  const { data: allCategories, isLoading: categoriesLoading } = useAllCategories();
  const rootCategories = allCategories?.filter(c => !c.parent_id) || [];

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const activeCategory = rootCategories.find(c => c.id === activeCategoryId);

  const { data: subcategories } = useSubcategories(activeCategoryId || undefined);

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
      <div className="bg-white text-[#181d19] min-h-screen pb-32 font-['Plus_Jakarta_Sans',sans-serif]">
        
        {/* Glassmorphic TopAppBar */}
        <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-white/90 backdrop-blur-xl border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="hover:bg-gray-100 transition-colors p-2 -ml-2 rounded-md flex items-center justify-center scale-95 duration-200"
            >
              <ArrowLeft className="text-[#0d5200] w-6 h-6" />
            </button>
            <h1 className="font-bold text-xl font-['Epilogue',sans-serif] tracking-tight text-[#0d5200]">
              {activeCategory ? activeCategory.name : 'All Categories'}
            </h1>
          </div>
          <button 
            onClick={() => navigate('/search')}
            className="hover:bg-gray-100 transition-colors p-2 -mr-2 rounded-md flex items-center justify-center scale-95 duration-200"
          >
            <Search className="text-[#0d5200] w-6 h-6" />
          </button>
        </header>

        <main className="pt-24 px-4 sm:px-6 max-w-[1400px] mx-auto">
          
          {/* Promotional Banner */}
          {activeCategoryId === null && (
            <section className="relative overflow-hidden rounded-lg bg-[#1d6c0a] text-[#98eb7d] p-6 flex flex-col md:flex-row justify-between items-center min-h-[160px] shadow-[0_8px_30px_rgba(29,108,10,0.15)] mb-6">
              <div className="z-10 flex-1 w-full">
                <span className="text-xs font-bold text-white uppercase tracking-widest opacity-80 mb-2 block">Exclusive Offer</span>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2 font-['Epilogue',sans-serif]">10% OFF Fresh Produce</h2>
                <p className="text-sm font-medium text-white opacity-90 max-w-[200px] mb-4">Straight from the Ambur fields to your doorstep.</p>
                <button 
                  onClick={() => navigate('/search')}
                  className="bg-[#ffffff] text-[#0d5200] px-6 py-2.5 rounded-md font-bold text-sm shadow-sm hover:bg-[#f6faf4] transition-colors"
                >
                  Shop Now
                </button>
              </div>
              <div className="absolute right-0 top-0 h-full w-1/2 overflow-hidden pointer-events-none hidden sm:block">
                <div className="w-full h-full bg-[#0d5200]/20 transform scale-110 rotate-3 backdrop-blur-sm rounded-l-lg"></div>
              </div>
              {/* Glass Overlay Shape */}
              <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-[#a3f788]/20 blur-3xl rounded-lg"></div>
            </section>
          )}

          {/* Category Chips (Horizontal Scroll) */}
          <section className="flex gap-2.5 overflow-x-auto pb-6 no-scrollbar">
            {categoriesLoading ? (
              [...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-28 rounded-md shrink-0 bg-gray-100" />)
            ) : (
              <>
                <button
                  onClick={() => setActiveCategoryId(null)}
                  className={cn(
                    'px-5 py-2 rounded-md font-semibold whitespace-nowrap text-sm transition-all duration-200 border',
                    activeCategoryId === null
                      ? 'bg-[#1d6c0a] text-[#ffffff] border-[#1d6c0a] shadow-sm'
                      : 'bg-[#f9f9f9] text-[#40493b] border-gray-200 hover:bg-gray-100 font-medium'
                  )}
                >
                  All
                </button>
                {rootCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={cn(
                      'px-5 py-2 rounded-md font-semibold whitespace-nowrap text-sm transition-all duration-200 border',
                      activeCategoryId === cat.id
                        ? 'bg-[#1d6c0a] text-[#ffffff] border-[#1d6c0a] shadow-sm'
                        : 'bg-[#f9f9f9] text-[#40493b] border-gray-200 hover:bg-gray-100 font-medium'
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </>
            )}
          </section>

          {/* Uniform Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col bg-white rounded-lg p-3 border border-gray-100 shadow-sm h-full">
                  <Skeleton className="w-full aspect-square rounded-md mb-3 bg-gray-100" />
                  <Skeleton className="h-4 w-3/4 mb-1.5 bg-gray-100" />
                  <Skeleton className="h-3 w-1/2 mb-4 bg-gray-100" />
                  <div className="mt-auto flex justify-between items-center">
                    <Skeleton className="h-5 w-12 bg-gray-100" />
                    <Skeleton className="h-8 w-20 rounded-md bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {products.map((product) => {
                const qty = getItemQuantity(product.id);
                const displayPrice = product.admin_selling_price ?? product.selling_price;
                const isOutOfStock = (product.stock_quantity ?? 0) <= 0 || product.status === 'out_of_stock';

                return (
                  <div 
                    key={product.id} 
                    className={cn(
                      "group relative flex flex-col bg-white rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-gray-100 p-3 cursor-pointer hover:border-[#1d6c0a]/30 hover:shadow-[0_8px_24px_rgba(29,108,10,0.08)] transition-all h-full", 
                      isOutOfStock && "opacity-60 grayscale-[30%]"
                    )} 
                    onClick={() => navigate(`/product/${product.slug}`)}
                  >
                    {/* Uniform Image Container */}
                    <div className="relative bg-[#f9f9f9] rounded-md aspect-[4/5] sm:aspect-square mb-3 overflow-hidden flex items-center justify-center p-2">
                      
                      {/* Discount Badge */}
                      {product.mrp > displayPrice && (
                         <div className="absolute top-2 left-2 z-10 bg-[#a0346e] text-[#ffc8de] text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-tighter shadow-sm">
                           Save ₹{product.mrp - displayPrice}
                         </div>
                      )}

                      <img 
                        src={product.primary_image_url || '/placeholder.svg'} 
                        alt={product.name} 
                        className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500" 
                      />

                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                          <span className="bg-red-600 text-white px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide shadow-sm">Out of Stock</span>
                        </div>
                      )}
                    </div>

                    {/* Uniform Details Container */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1 mb-2">
                        <h3 className="font-bold text-[#181d19] text-[13px] sm:text-sm leading-tight line-clamp-2 font-['Epilogue',sans-serif]">{product.name}</h3>
                        <p className="text-[11px] text-[#707a6a] mt-1 line-clamp-1">{product.unit_value} {product.unit_type} · {product.vendor?.business_name || 'Ambur Farms'}</p>
                      </div>
                      
                      {/* Bottom Price & Add to Cart */}
                      <div className="mt-auto flex justify-between items-end gap-2 pt-2 border-t border-gray-50">
                        <div className="flex flex-col">
                          {product.mrp > displayPrice && <span className="text-[10px] text-gray-400 line-through">₹{product.mrp}</span>}
                          <p className="font-black text-[#0d5200] text-sm sm:text-base leading-none">₹{displayPrice}</p>
                        </div>

                        {!isOutOfStock && (
                          qty === 0 ? (
                            <button 
                              onClick={(e) => handleAddToCart(product, e)} 
                              className="h-8 sm:h-9 w-[64px] sm:w-[76px] rounded-md bg-white border border-[#1d6c0a]/40 text-[#1d6c0a] font-extrabold text-[11px] sm:text-xs flex items-center justify-center shadow-sm hover:bg-[#1d6c0a] hover:text-white hover:border-[#1d6c0a] transition-all uppercase tracking-wide"
                            >
                              ADD
                            </button>
                          ) : (
                            <div 
                              className="h-8 sm:h-9 w-[76px] sm:w-[86px] bg-[#1d6c0a] text-white rounded-md flex items-center shadow-sm justify-between px-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button 
                                className="w-6 h-full flex items-center justify-center hover:bg-white/20 rounded-md transition-colors" 
                                onClick={() => decrementQuantity(product.id)}
                              >
                                <Minus className="w-3.5 h-3.5"/>
                              </button>
                              <span className="text-xs sm:text-[13px] font-bold text-center w-4">{qty}</span>
                              <button 
                                className="w-6 h-full flex items-center justify-center hover:bg-white/20 rounded-md transition-colors" 
                                onClick={() => incrementQuantity(product.id)}
                              >
                                <Plus className="w-3.5 h-3.5"/>
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 flex flex-col items-center bg-[#f9f9f9] rounded-lg border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-white rounded-md flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                <ShoppingCart className="w-8 h-8 text-[#a3f788]" />
              </div>
              <p className="font-bold text-lg text-[#181d19] font-['Epilogue',sans-serif]">It's empty here</p>
              <p className="text-sm text-[#707a6a] mt-1">
                {activeCategory ? `No fresh items found in ${activeCategory.name}.` : 'No fresh items available at the moment.'}
              </p>
            </div>
          )}

          {/* View All Products Button */}
          {!isLoading && products && products.length > 0 && activeCategoryId !== null && (
            <div className="py-10 flex justify-center">
              <button 
                onClick={() => activeCategory ? navigate(`/category/${activeCategory.slug}`) : navigate('/search')} 
                className="w-full md:w-auto md:px-12 bg-white border border-[#1d6c0a] text-[#1d6c0a] hover:bg-[#f6faf4] font-bold py-3 rounded-md text-sm shadow-sm transition-all tracking-wide"
              >
                {activeCategory ? `Explore All in ${activeCategory.name}` : 'Explore All Items'}
              </button>
            </div>
          )}
        </main>

        {/* Floating Cart Panel (Reverted to the Preferred Black Design) */}
        {cartItemsCount > 0 && (
          <div 
            onClick={() => navigate('/cart')}
            className="fixed bottom-[85px] lg:bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-40 bg-[#181d19] backdrop-blur-md rounded-lg px-4 py-3.5 flex items-center justify-between shadow-xl cursor-pointer hover:bg-[#2d322e] transition-colors duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#a3f788] rounded-md flex items-center justify-center shadow-inner">
                <ShoppingCart className="text-[#0d5200] w-4 h-4" />
              </div>
              <span className="text-[#f6faf4] font-medium text-sm">
                {cartItemsCount} {cartItemsCount === 1 ? 'Item' : 'Items'} added
              </span>
            </div>
            <div className="flex items-center gap-2 pl-4 border-l border-white/20">
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
