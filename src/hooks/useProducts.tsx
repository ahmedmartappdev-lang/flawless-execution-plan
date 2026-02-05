import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/types/database';

export function useProducts(categorySlug?: string) {
  return useQuery({
    queryKey: ['products', categorySlug],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (categorySlug) {
        query = query.eq('category.slug', categorySlug);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (Product & { category: Category })[];
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      return data as (Product & { category: Category }) | null;
    },
    enabled: !!slug,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('status', 'active')
        .eq('is_featured', true)
        .limit(10);
      
      if (error) throw error;
      return data as (Product & { category: Category })[];
    },
  });
}

export function useTrendingProducts() {
  return useQuery({
    queryKey: ['products', 'trending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('status', 'active')
        .eq('is_trending', true)
        .limit(10);
      
      if (error) throw error;
      return data as (Product & { category: Category })[];
    },
  });
}

export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('status', 'active')
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(20);
      
      if (error) throw error;
      return data as (Product & { category: Category })[];
    },
    enabled: query.length >= 2,
  });
}

// NEW: Added for Product Details Page (Similar Products)
export function useRelatedProducts(categoryId: string | undefined, currentProductId: string | undefined) {
  return useQuery({
    queryKey: ['products', 'related', categoryId, currentProductId],
    queryFn: async () => {
      if (!categoryId) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('category_id', categoryId)
        .neq('id', currentProductId || '') // Exclude the current product
        .eq('status', 'active')
        .limit(10);
      
      if (error) throw error;
      return data as (Product & { category: Category })[];
    },
    enabled: !!categoryId,
  });
}
