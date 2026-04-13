import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, ChevronRight, Package } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCategory, useAllCategories, useSubcategories } from '@/hooks/useCategories';
import { HeroBannerSlider } from '@/components/customer/home/HeroBannerSlider';
import type { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type Product = Database['public']['Tables']['products']['Row'];

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem, incrementQuantity, decrementQuantity, getItemQuantity, getTotalItems, getTotalAmount } = useCartStore();

  const cartItemsCount = getTotalItems();
  const cartTotal = getTotalAmount();

  // 1. Fetch Current Category based on URL
  const { data: category, isLoading: categoryLoading } = useCategory(slug || '');

  // 2. Fetch All Categories for the Horizontal Pill Bar
  const { data: allCats, isLoading: allCatsLoading } = useAllCategories();
  const rootCategories = allCats?.filter(c => !c.parent_id) || [];
  
  // Determine which pill should be active (handles subcategories gracefully)
  const activeCategoryId = category?.parent_id || category?.id;

  // 3. Fetch Subcategories (if the current category is a parent, we want to fetch all its subcategory products too)
  const { data: subcategories, isLoading: subLoading } = useSubcategories(activeCategoryId);

  // 4. Fetch Products for the selected category
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['category-products', category?.id, subcategories?.map(s => s.id)],
    queryFn: async () => {
      if (!category?.id) return [];

      let query = supabase
        .from('products')
        .select('*, vendor:vendors(business_name)')
        .eq('status', 'active');

      // If it's a parent category, fetch its products AND its subcategories' products
      if (!category.parent_id && subcategories && subcategories.length > 0) {
        const allIds = [category.id, ...subcategories.map(s => s.id)];
        query = query.in('category_id', allIds);
      } else {
        // If it's a subcategory, just fetch its own products
        query = query.eq('category_id', category.id);
      }

      const { data, error } = await query.order('name', { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!category?.id && !subLoading,
  });

  const isLoading = categoryLoading || allCatsLoading || productsLoading;

  // Limit the number of products shown directly on this page
  const displayedProducts = products ? products.slice(0, 8) : [];

  const handleAddToCart = (product: any) => {
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
    <CustomerLayout>
      <div className="bg-white min-h-screen pb-32">
        
        {/* 1. Homescreen Banner */}
        <div className="bg-white pt-2 pb-1">
          <HeroBannerSlider />
        </div>

        {/* 2. Category Bubble Buttons (Horizontal Scroll) */}
        <div className="border-b border-gray-100 bg-white sticky top-[60px] md:top-[70px] z-30 shadow-sm">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-3 px-4">
              {rootCategories.map((cat) => {
                const isActive = activeCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => navigate(`/category/${cat.slug}`)}
                    className={cn(
                      'shrink-0 px-4 py-1.5 rounded-full text-[13px] transition-colors whitespace-nowrap border flex items-center gap-2 font-medium',
                      isActive
                        ? 'bg-[#e8f5e9] border-[#2e7d32] text-[#2e7d32] font-bold shadow-sm'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                    )}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto">
          {/* Product Count Header */}
          {!isLoading && displayedProducts.length > 0 && (
            <div className="px-4 py-3 text-[14px] font-bold text-gray-900 border-b border-gray-50">
              {products?.length || 0} Products
            </div>
          )}

          {/* 3. Product List (Exact HTML Match) */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex flex-col">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex p-4 border-b border-gray-100 bg-white">
                    <Skeleton className="w-[90px] h-[90px] rounded-xl mr-4 shrink-0" />
                    <div className="flex-1 flex flex-col justify-center">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/4 mb-4" />
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-8 w-20 rounded-md" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:p-4 md:border-none">
                {displayedProducts.map((product) => {
                  const qty = getItemQuantity(product.id);
                  const displayPrice = product.admin_selling_price ?? product.selling_price;
                  const discount = product.mrp > displayPrice
                    ? Math.round(((product.mrp - displayPrice) / product.mrp) * 100)
                    : 0;
                  const isOutOfStock = (product.stock_quantity ?? 0) <= 0 || product.status === 'out_of_stock';

                  return (
                    <div
                      key={product.id}
                      className={cn(
                        "flex p-4 border-b border-gray-100 bg-white md:border md:rounded-xl",
                        isOutOfStock ? "opacity-60 grayscale-[30%]" : ""
                      )}
                    >
                      {/* Image Wrapper */}
                      <div 
                        className="w-[90px] h-[90px] bg-[#f9f9f9] rounded-xl relative mr-4 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer"
                        onClick={() => navigate(`/product/${product.slug}`)}
                      >
                        {discount > 0 && (
                          <span className="absolute top-0 left-0 bg-[#43a047] text-white text-[10px] px-2 py-0.5 rounded-br-[10px] font-semibold z-10">
                            {discount}% off
                          </span>
                        )}
                        <img
                          src={product.primary_image_url || '/placeholder.svg'}
                          alt={product.name}
                          className="w-full h-full object-contain p-2"
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-10 flex items-center justify-center">
                            <span className="bg-destructive text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide">
                              No Stock
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info Wrapper */}
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <div 
                          className="text-[14px] font-semibold text-gray-900 mb-1 truncate cursor-pointer"
                          onClick={() => navigate(`/product/${product.slug}`)}
                        >
                          {product.name}
                        </div>
                        
                        <div className="text-[12px] text-gray-500 border border-gray-200 px-2 py-0.5 rounded w-fit mb-3 flex items-center gap-1">
                          {product.unit_value} {product.unit_type} <span className="text-[8px]">▼</span>
                        </div>
                        
                        <div className="flex justify-between items-center mt-auto">
                          <div className="flex items-baseline flex-wrap gap-x-1.5">
                            <span className="font-extrabold text-[16px] text-gray-900">₹{displayPrice}</span>
                            {product.mrp > displayPrice && (
                              <span className="text-[12px] text-gray-400 line-through">₹{product.mrp}</span>
                            )}
                          </div>

                          {/* Controls */}
                          {isOutOfStock ? (
                            <span className="text-xs text-destructive font-semibold">Unavailable</span>
                          ) : qty === 0 ? (
                            <button
                              className="border border-gray-200 bg-white text-[#2e7d32] px-4 py-1.5 rounded-md text-[12px] font-bold shadow-sm hover:bg-gray-50 transition-colors"
                              onClick={() => handleAddToCart(product)}
                            >
                              + ADD
                            </button>
                          ) : (
                            <div className="flex items-center border border-gray-200 rounded-md p-0.5 gap-3 bg-white h-[32px]">
                              <button
                                className="w-7 h-full flex items-center justify-center text-gray-400 font-bold hover:text-gray-600 transition-colors"
                                onClick={() => decrementQuantity(product.id)}
                              >
                                −
                              </button>
                              <span className="font-bold text-[14px] min-w-[12px] text-center">{qty}</span>
                              <button
                                className="w-7 h-full flex items-center justify-center text-[#2e7d32] font-bold hover:text-green-800 transition-colors"
                                onClick={() => incrementQuantity(product.id)}
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : category ? (
              <div className="text-center py-20 flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-10 h-10 text-gray-300" />
                </div>
                <p className="font-semibold text-lg text-gray-900">No products found</p>
                <p className="text-sm text-gray-500">
                  There are currently no products available in this category.
                </p>
              </div>
            ) : (
              <div className="text-center py-20">
                <h2 className="text-xl font-bold mb-2">Category Not Found</h2>
                <Button onClick={() => navigate('/')}>Go Home</Button>
              </div>
            )}

            {/* 4. View All Products Button */}
            {!isLoading && displayedProducts.length > 0 && (
              <div className="p-4 mt-2 mb-10 flex justify-center">
                <Button 
                  onClick={() => navigate('/search')} 
                  className="w-full md:w-[300px] bg-white border-2 border-[#2e7d32] text-[#2e7d32] hover:bg-[#e8f5e9] font-bold py-6 rounded-xl text-[15px] shadow-sm transition-all"
                >
                  View All Products
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 5. Floating Sticky Cart */}
        {cartItemsCount > 0 && (
          <div 
            onClick={() => navigate('/cart')}
            className="fixed bottom-[85px] lg:bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[370px] bg-[#2e7d32] text-white px-5 py-3.5 rounded-xl flex justify-between items-center shadow-[0_8px_20px_rgba(0,0,0,0.2)] z-50 cursor-pointer hover:bg-green-800 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="border-r border-white/30 pr-4 flex items-center gap-2 text-[14px] font-medium">
                <ShoppingCart className="w-[18px] h-[18px]" />
                {cartItemsCount} {cartItemsCount === 1 ? 'Item' : 'Items'}
              </div>
              <div className="font-extrabold text-[17px]">₹{cartTotal.toFixed(0)}</div>
            </div>
            <div className="text-[13px] font-semibold flex items-center gap-1">
              View Cart <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        )}

      </div>
    </CustomerLayout>
  );
};

export default CategoryPage;
