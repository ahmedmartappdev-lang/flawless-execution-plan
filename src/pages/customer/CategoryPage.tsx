import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, ArrowUpDown } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { BottomNavigation } from '@/components/customer/BottomNavigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Header } from '@/components/customer/Header';
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
  const { addItem, incrementQuantity, decrementQuantity, getItemQuantity } = useCartStore();
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');

  // 1. Fetch Category
  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').eq('slug', slug).maybeSingle();
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
      let query = supabase.from('products').select('*').eq('category_id', category.id).eq('status', 'active');
      switch (sortBy) {
        case 'name_asc': query = query.order('name', { ascending: true }); break;
        case 'name_desc': query = query.order('name', { ascending: false }); break;
        case 'price_low': query = query.order('selling_price', { ascending: true }); break;
        case 'price_high': query = query.order('selling_price', { ascending: false }); break;
        case 'popularity': query = query.order('created_at', { ascending: false }); break;
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!category?.id,
  });

  const isLoading = categoryLoading || productsLoading;

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
      
      {/* SHARED HEADER */}
      <Header />

      {/* --- PAGE TITLE BAR --- */}
      <div className="border-b border-[#eee] px-[4%] py-[15px] flex items-center justify-between">
        {categoryLoading ? (
          <Skeleton className="h-6 w-48" />
        ) : (
          <h1 className="text-[18px] font-bold text-[#333]">
            Buy {category?.name || 'Products'} Online
          </h1>
        )}

        {/* Sorting Dropdown */}
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
                ? Math.round(((product.mrp - product.selling_price) / product.mrp) * 100) : 0;

              return (
                <div key={product.id} className="border border-[#e8e8e8] rounded-[12px] p-[12px] relative bg-white hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
                  {discount > 0 && (
                    <div className="absolute top-0 left-[10px] bg-[#4a75e6] text-white text-[10px] font-extrabold px-[6px] py-[4px] rounded-b-[4px] z-[5]">
                      {discount}% OFF
                    </div>
                  )}
                  <div className="h-[150px] flex items-center justify-center mb-[10px] cursor-pointer" onClick={() => navigate(`/product/${product.slug}`)}>
                    <img src={product.primary_image_url || '/placeholder.svg'} alt={product.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="bg-[#f8f8f8] text-[9px] font-extrabold px-[6px] py-[3px] rounded-[4px] flex items-center gap-[4px] w-fit mb-[10px]">
                    <Clock className="w-3 h-3" /> 16 MINS
                  </div>
                  <h3 className="text-[13px] font-semibold leading-[1.4] h-[38px] overflow-hidden mb-[4px] text-[#1f1f1f] line-clamp-2" title={product.name}>
                    {product.name}
                  </h3>
                  <div className="text-[12px] text-[#666] mb-[15px]">
                    {product.unit_value} {product.unit_type}
                  </div>
                  <div className="mt-auto flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold">₹{product.selling_price}</span>
                      {product.mrp > product.selling_price && <span className="text-[11px] text-[#999] line-through">₹{product.mrp}</span>}
                    </div>
                    {qty === 0 ? (
                      <button className="border border-[#0c831f] bg-[#f7fff9] text-[#0c831f] min-w-[75px] px-[10px] py-[6px] rounded-[8px] font-bold text-[13px] hover:bg-[#0c831f] hover:text-white transition-colors" onClick={() => handleAddToCart(product)}>ADD</button>
                    ) : (
                      <div className="flex items-center bg-[#0c831f] text-white rounded-[8px] h-[32px]">
                        <button className="px-2 h-full font-bold hover:bg-[#096e1a] rounded-l-[8px]" onClick={() => decrementQuantity(product.id)}>-</button>
                        <span className="px-1 text-[13px] font-bold min-w-[20px] text-center">{qty}</span>
                        <button className="px-2 h-full font-bold hover:bg-[#096e1a] rounded-r-[8px]" onClick={() => incrementQuantity(product.id)}>+</button>
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
            <Button variant="link" onClick={() => navigate('/')} className="mt-2 text-[#0c831f]">Return to Home</Button>
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
