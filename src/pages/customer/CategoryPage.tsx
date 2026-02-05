import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingCart, User, Clock, ChevronDown, ArrowUpDown } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { BottomNavigation } from '@/components/customer/BottomNavigation';
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
import type { Database } from '@/integrations/supabase/types';

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
  const { user } = useAuthStore();
  const { items, addItem, incrementQuantity, decrementQuantity, getItemQuantity } = useCartStore();
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Category
  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // 2. Fetch Products with Sorting
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['category-products', category?.id, sortBy],
    queryFn: async () => {
      if (!category?.id) return [];

      let query = supabase
        .from('products')
        .select('*')
        .eq('category_id', category.id)
        .eq('status', 'active');

      // Apply sorting
      switch (sortBy) {
        case 'name_asc':
          query = query.order('name', { ascending: true });
          break;
        case 'name_desc':
          query = query.order('name', { ascending: false });
          break;
        case 'price_low':
          query = query.order('selling_price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('selling_price', { ascending: false });
          break;
        case 'popularity':
          // Assuming there's a total_orders field, otherwise fallback to name
          query = query.order('created_at', { ascending: false }); 
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!category?.id,
  });

  const isLoading = categoryLoading || productsLoading;

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

  return (
    <div className="min-h-screen bg-white text-[#1f1f1f] font-sans pb-20">
      
      {/* --- STICKY HEADER --- */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#eeeeee] px-[4%] py-2.5 flex items-center h-[80px]">
        {/* PREMIUM BRANDING: AHMAD MART */}
        <div className="flex items-center gap-1 cursor-pointer select-none transition-transform hover:scale-105 mr-10" onClick={() => navigate('/')}>
           <h1 className="font-serif text-3xl font-extrabold tracking-tight leading-none">
            <span className="text-[#facc15] drop-shadow-sm">Ahmad</span>
            <span className="text-[#0c831f] ml-1.5">Mart</span>
          </h1>
        </div>

        {/* Delivery Info */}
        <div className="hidden lg:flex flex-col border-l border-[#ddd] pl-5 min-w-[200px] cursor-pointer">
          <span className="font-extrabold text-[14px]">Delivery in 15 minutes</span>
          <span className="text-[13px] text-[#666] whitespace-nowrap overflow-hidden text-ellipsis flex items-center">
            Knowledge Park II, Greater... <ChevronDown className="w-3 h-3 ml-1" />
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex-grow mx-10 relative hidden md:block">
          <Search className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#888] w-4 h-4" />
          <input 
            type="text" 
            className="w-full bg-[#f8f8f8] border border-[#efefef] rounded-[10px] py-[14px] pl-[45px] pr-[14px] text-[14px] outline-none focus:border-[#0c831f] transition-colors"
            placeholder={`Search '${category?.name || 'products'}'`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>

        {/* Nav Right */}
        <div className="flex items-center gap-[25px] ml-auto">
          <div className="hidden md:flex items-center gap-1 font-semibold text-[16px] cursor-pointer" onClick={() => user ? navigate('/profile') : navigate('/auth')}>
            {user ? 'Account' : 'Login'} <ChevronDown className="w-4 h-4" />
          </div>
          <button 
            className="bg-[#0c831f] text-white px-[18px] py-[12px] rounded-[8px] font-bold border-none flex items-center gap-[10px] cursor-pointer hover:bg-[#096e1a]"
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

      {/* --- PAGE TITLE BAR --- */}
      <div className="border-b border-[#eee] px-[4%] py-[15px] flex items-center justify-between">
        {categoryLoading ? (
          <Skeleton className="h-6 w-48" />
        ) : (
          <h1 className="text-[18px] font-bold text-[#333]">
            Buy {category?.name || 'Products'} Online
          </h1>
        )}

        {/* Sorting Dropdown (Integrated into Title Bar) */}
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

      <main className="max-w-[1400px] mx-auto px-[4%] py-5">
        
        {/* --- PRODUCT GRID --- */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[16px]">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="border border-[#e8e8e8] rounded-xl p-3 h-[280px]">
                <Skeleton className="h-[140px] w-full mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-4" />
                <div className="mt-auto flex justify-between items-end">
                   <Skeleton className="h-6 w-12" />
                   <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[16px] mb-10">
            {products.map((product) => {
              const qty = getItemQuantity(product.id);
              const discount = product.mrp > product.selling_price 
                ? Math.round(((product.mrp - product.selling_price) / product.mrp) * 100) 
                : 0;

              return (
                <div 
                  key={product.id} 
                  className="border border-[#e8e8e8] rounded-[12px] p-[12px] relative bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-200 flex flex-col h-full"
                >
                  {/* Discount Badge */}
                  {discount > 0 && (
                    <div className="absolute top-0 left-[10px] bg-[#4a75e6] text-white text-[10px] font-extrabold px-[6px] py-[4px] rounded-b-[4px] z-[5]">
                      {discount}% OFF
                    </div>
                  )}

                  {/* Image */}
                  <div 
                    className="h-[150px] flex items-center justify-center mb-[10px] cursor-pointer"
                    onClick={() => navigate(`/product/${product.slug}`)}
                  >
                    <img 
                      src={product.primary_image_url || '/placeholder.svg'} 
                      alt={product.name} 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {/* Timer */}
                  <div className="bg-[#f8f8f8] text-[9px] font-extrabold px-[6px] py-[3px] rounded-[4px] flex items-center gap-[4px] w-fit mb-[10px]">
                    <Clock className="w-3 h-3" />
                    16 MINS
                  </div>

                  {/* Name */}
                  <h3 
                    className="text-[13px] font-semibold leading-[1.4] h-[38px] overflow-hidden mb-[4px] text-[#1f1f1f] line-clamp-2" 
                    title={product.name}
                  >
                    {product.name}
                  </h3>

                  {/* Quantity */}
                  <div className="text-[12px] text-[#666] mb-[15px]">
                    {product.unit_value} {product.unit_type}
                  </div>

                  {/* Footer (Price + Add) */}
                  <div className="mt-auto flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold">₹{product.selling_price}</span>
                      {product.mrp > product.selling_price && (
                        <span className="text-[11px] text-[#999] line-through">₹{product.mrp}</span>
                      )}
                    </div>

                    {qty === 0 ? (
                      <button 
                        className="border border-[#0c831f] bg-[#f7fff9] text-[#0c831f] min-w-[75px] px-[10px] py-[6px] rounded-[8px] font-bold text-[13px] cursor-pointer text-center flex flex-col items-center leading-[1.1] hover:bg-[#0c831f] hover:text-white group transition-colors"
                        onClick={() => handleAddToCart(product)}
                      >
                        ADD
                      </button>
                    ) : (
                      <div className="flex items-center bg-[#0c831f] text-white rounded-[8px] h-[32px]">
                        <button 
                          className="px-2 h-full font-bold hover:bg-[#096e1a] rounded-l-[8px]"
                          onClick={() => decrementQuantity(product.id)}
                        >
                          -
                        </button>
                        <span className="px-1 text-[13px] font-bold min-w-[20px] text-center">{qty}</span>
                        <button 
                          className="px-2 h-full font-bold hover:bg-[#096e1a] rounded-r-[8px]"
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
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4 text-4xl">📦</div>
            <p className="font-semibold text-lg">No products found</p>
            <p className="text-sm">There are currently no products in this category.</p>
            <Button variant="link" onClick={() => navigate('/')} className="mt-2 text-[#0c831f]">
              Return to Home
            </Button>
          </div>
        ) : (
           <div className="text-center py-20">
             <h2 className="text-xl font-bold mb-2">Category Not Found</h2>
             <Button onClick={() => navigate('/')}>Go Home</Button>
           </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default CategoryPage;
