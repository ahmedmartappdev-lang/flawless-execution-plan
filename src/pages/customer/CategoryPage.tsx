import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ArrowUpDown } from 'lucide-react';
import { Header } from '@/components/customer/Header';
import { ProductCard } from '@/components/customer/ProductCard';
import { BottomNavigation } from '@/components/customer/BottomNavigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');

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
          query = query.order('total_orders', { ascending: false });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!category?.id,
  });

  const isLoading = categoryLoading || productsLoading;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="px-4 py-4 space-y-4">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4 mx-1" />
          {categoryLoading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <span className="text-foreground font-medium">{category?.name}</span>
          )}
        </nav>

        {/* Category Header */}
        {categoryLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        ) : category ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {category.image_url && (
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <h1 className="text-2xl font-bold text-foreground">{category.name}</h1>
            </div>
            {category.description && (
              <p className="text-muted-foreground">{category.description}</p>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Category not found</p>
            <Link to="/" className="text-primary hover:underline mt-2 inline-block">
              Back to Home
            </Link>
          </div>
        )}

        {/* Sort & Filter Bar */}
        {category && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {products?.length || 0} products
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  {sortLabels[sortBy]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => setSortBy(option)}
                    className={sortBy === option ? 'bg-accent' : ''}
                  >
                    {sortLabels[option]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                <Skeleton className="aspect-square" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : category ? (
          <div className="text-center py-12 text-muted-foreground">
            <span className="text-4xl mb-4 block">📦</span>
            <p className="font-medium">No products in this category</p>
            <p className="text-sm">Check back soon for new arrivals!</p>
          </div>
        ) : null}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default CategoryPage;
