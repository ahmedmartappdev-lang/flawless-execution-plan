import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, ArrowUpDown, Package } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { CustomerLayout } from '@/components/layouts/CustomerLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useCategory, useSubcategories, useAllCategories } from '@/hooks/useCategories';
import type { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type Product = Database['public']['Tables']['products']['Row'];

type SortOption = 'name_asc' | 'name_desc' | 'price_low' | 'price_high' | 'popularity';

const sortLabels: Record<SortOption, string> = {
  name_asc: 'Name A-Z',
  name_desc: 'Name Z-A',
  price_low: 'Price: Low to High',
  price_high: 'Price: High to Low',
  popularity: 'Popularity',
};

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem, incrementQuantity, decrementQuantity, getItemQuantity } = useCartStore();
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [activeSubId, setActiveSubId] = useState<string | null>(null);

  // 1. Fetch Category
  const { data: category, isLoading: categoryLoading } = useCategory(slug || '');

  // 2. Fetch Subcategories
  const { data: subcategories, isLoading: subLoading } = useSubcategories(category?.id);
  // 2b. Fetch all categories to find parent name if this is a subcategory
  const { data: allCats } = useAllCategories();
  const parentCategory = category?.parent_id
    ? allCats?.find(c => c.id === category.parent_id)
    : null;

  const hasSubcategories = subcategories && subcategories.length > 0;

  // Reset active subcategory when parent changes
  useEffect(() => {
    setActiveSubId(null);
  }, [category?.id]);

  // 3. Fetch Products — if subcategories exist, filter by selected sub (or all subs)
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['category-products', category?.id, activeSubId, subcategories?.map(s => s.id), sortBy],
    queryFn: async () => {
      if (!category?.id) return [];

      let query = supabase
        .from('products')
        .select('*, vendor:vendors(business_name)')
        .eq('status', 'active');

      if (hasSubcategories) {
        if (activeSubId) {
          // Specific subcategory selected
          query = query.eq('category_id', activeSubId);
        } else {
          // "All" — show products from all subcategories + parent itself
          const allIds = [category.id, ...subcategories!.map(s => s.id)];
          query = query.in('category_id', allIds);
        }
      } else {
        // No subcategories — just fetch this category's products
        query = query.eq('category_id', category.id);
      }

      switch (sortBy) {
        case 'name_asc':
          query = query.order('name', { ascending: true });
          break;
        case 'name_desc':
          query = query.order('name', { ascending: false });
          break;
        case 'price_low':
          query = query.order('admin_selling_price', { ascending: true, nullsFirst: false });
          break;
        case 'price_high':
          query = query.order('admin_selling_price', { ascending: false, nullsFirst: false });
          break;
        case 'popularity':
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!category?.id && !subLoading,
  });

  const isLoading = categoryLoading || productsLoading;

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

  const activeSubName = activeSubId
    ? subcategories?.find(s => s.id === activeSubId)?.name
    : null;

  return (
    <CustomerLayout>
      {/* Title Bar */}
      <div className="border-b border-border px-[4%] py-[15px] flex items-center justify-between bg-white">
        {categoryLoading ? (
          <Skeleton className="h-6 w-48" />
        ) : (
          <div>
            {parentCategory && (
              <button
                onClick={() => navigate(`/category/${parentCategory.slug}`)}
                className="text-xs text-primary font-medium hover:underline mb-0.5 block"
              >
                ← {parentCategory.name}
              </button>
            )}
            <h1 className="text-[18px] font-bold text-foreground">
              Buy {category?.name || 'Products'} Online
            </h1>
            {activeSubName && (
              <p className="text-xs text-muted-foreground mt-0.5">{activeSubName}</p>
            )}
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-foreground">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              {sortLabels[sortBy]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {(Object.keys(sortLabels) as SortOption[]).map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() => setSortBy(option)}
                className={`cursor-pointer ${sortBy === option ? 'bg-accent font-medium' : ''}`}
              >
                {sortLabels[option]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Subcategory Tabs — horizontal scroll on mobile, below title bar */}
      {hasSubcategories && (
        <div className="border-b border-border bg-white sticky top-[64px] md:top-[80px] z-20">
          <div className="max-w-[1400px] mx-auto px-[4%]">
            <div className="flex gap-1 overflow-x-auto no-scrollbar py-2">
              <button
                className={cn(
                  'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                  activeSubId === null
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100'
                )}
                onClick={() => setActiveSubId(null)}
              >
                All
              </button>
              {subcategories!.map((sub) => (
                <button
                  key={sub.id}
                  className={cn(
                    'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2',
                    activeSubId === sub.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100'
                  )}
                  onClick={() => setActiveSubId(sub.id)}
                >
                  {sub.image_url && (
                    <img src={sub.image_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                  )}
                  {sub.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-[4%] py-5 pb-24 flex gap-0 bg-white">
        {/* Desktop Sidebar — only when subcategories exist */}
        {hasSubcategories && (
          <aside className="hidden lg:block w-[220px] shrink-0 mr-6">
            <div className="sticky top-[140px] space-y-1">
              <button
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  activeSubId === null
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-gray-50'
                )}
                onClick={() => setActiveSubId(null)}
              >
                All {category?.name}
              </button>
              {subcategories!.map((sub) => (
                <button
                  key={sub.id}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                    activeSubId === sub.id
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:bg-gray-50'
                  )}
                  onClick={() => setActiveSubId(sub.id)}
                >
                  {sub.image_url && (
                    <img src={sub.image_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                  )}
                  {sub.name}
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[16px]">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="border border-border bg-white rounded-xl p-3 h-[280px]">
                  <Skeleton className="h-[140px] w-full mb-3 rounded-lg" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-4" />
                  <div className="mt-auto flex justify-between items-end">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-8 w-16 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[16px] mb-10">
              {products.map((product) => {
                const qty = getItemQuantity(product.id);
                const displayPrice = product.admin_selling_price ?? product.selling_price;
                const discount = product.mrp > displayPrice
                  ? Math.round(((product.mrp - displayPrice) / product.mrp) * 100)
                  : 0;
                const isOutOfStock = (product.stock_quantity ?? 0) <= 0 || product.status === 'out_of_stock';

                return (
                  <div
                    key={product.id}
                    className={`border border-border rounded-[12px] p-[12px] relative bg-white hover:shadow-lg transition-shadow duration-200 flex flex-col h-full ${isOutOfStock ? 'opacity-60' : ''}`}
                  >
                    {discount > 0 && (
                      <div className="absolute top-0 left-[10px] bg-primary text-primary-foreground text-[10px] font-extrabold px-[6px] py-[4px] rounded-b-[4px] z-[5]">
                        {discount}% OFF
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-[12px]">
                        <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    <div
                      className="flex items-center justify-center mb-[10px] cursor-pointer py-2 bg-white"
                      onClick={() => navigate(`/product/${product.slug}`)}
                    >
                      <div className="w-[120px] h-[120px] rounded-lg overflow-hidden bg-white border border-gray-50 flex items-center justify-center">
                        <img
                          src={product.primary_image_url || '/placeholder.svg'}
                          alt={product.name}
                          className="max-w-full max-h-full object-contain p-2"
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 text-gray-600 border border-gray-100 text-[9px] font-extrabold px-[6px] py-[3px] rounded-[4px] flex items-center gap-[4px] w-fit mb-[10px]">
                      <Clock className="w-3 h-3" />
                      16 MINS
                    </div>

                    <h3
                      className="text-[13px] font-semibold leading-[1.4] h-[38px] overflow-hidden mb-[4px] text-foreground line-clamp-2"
                      title={product.name}
                    >
                      {product.name}
                    </h3>

                    <div className="text-[12px] text-muted-foreground mb-[15px]">
                      {product.unit_value} {product.unit_type}
                    </div>

                    <div className="mt-auto flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold">₹{displayPrice}</span>
                        {product.mrp > displayPrice && (
                          <span className="text-[11px] text-muted-foreground line-through">₹{product.mrp}</span>
                        )}
                      </div>

                      {isOutOfStock ? (
                        <span className="text-xs text-destructive font-semibold">Unavailable</span>
                      ) : qty === 0 ? (
                        <button
                          className="border border-primary bg-primary/5 text-primary min-w-[75px] px-[10px] py-[6px] rounded-[8px] font-bold text-[13px] cursor-pointer text-center hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => handleAddToCart(product)}
                        >
                          ADD
                        </button>
                      ) : (
                        <div className="flex items-center bg-primary text-primary-foreground rounded-[8px] h-[32px]">
                          <button
                            className="px-2 h-full font-bold hover:bg-primary/90 rounded-l-[8px]"
                            onClick={() => decrementQuantity(product.id)}
                          >
                            -
                          </button>
                          <span className="px-1 text-[13px] font-bold min-w-[20px] text-center">{qty}</span>
                          <button
                            className="px-2 h-full font-bold hover:bg-primary/90 rounded-r-[8px]"
                            onClick={() => incrementQuantity(product.id)}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : category ? (
            <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Package className="w-10 h-10 text-gray-300" />
              </div>
              <p className="font-semibold text-lg text-gray-900">No products found</p>
              <p className="text-sm">
                {activeSubId
                  ? 'No products in this subcategory yet.'
                  : 'There are currently no products in this category.'}
              </p>
              {activeSubId ? (
                <Button variant="link" onClick={() => setActiveSubId(null)} className="mt-2 text-primary">
                  View All {category.name}
                </Button>
              ) : (
                <Button variant="link" onClick={() => navigate('/')} className="mt-2 text-primary">
                  Return to Home
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-20">
              <h2 className="text-xl font-bold mb-2">Category Not Found</h2>
              <Button onClick={() => navigate('/')}>Go Home</Button>
            </div>
          )}
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CategoryPage;
