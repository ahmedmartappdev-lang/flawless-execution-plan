import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/types/database';

const PRODUCT_SELECT = `
  *,
  category:categories(*),
  vendor:vendors(business_name)
`;

export function useProducts(categorySlug?: string) {
  return useQuery({
    queryKey: ['products', categorySlug],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .in('status', ['active', 'out_of_stock'])
        .not('admin_selling_price', 'is', null)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (categorySlug) {
        query = query.eq('category.slug', categorySlug);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (Product & { category: Category; vendor?: { business_name: string } })[];
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      return data as (Product & { category: Category; vendor?: { business_name: string } }) | null;
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
        .select(PRODUCT_SELECT)
        .in('status', ['active', 'out_of_stock'])
        .not('admin_selling_price', 'is', null)
        .eq('is_featured', true)
        .limit(10);
      
      if (error) throw error;
      return data as (Product & { category: Category; vendor?: { business_name: string } })[];
    },
  });
}

export function useTrendingProducts() {
  return useQuery({
    queryKey: ['products', 'trending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .in('status', ['active', 'out_of_stock'])
        .not('admin_selling_price', 'is', null)
        .eq('is_trending', true)
        .limit(10);
      
      if (error) throw error;
      return data as (Product & { category: Category; vendor?: { business_name: string } })[];
    },
  });
}

export function useSearchProducts(query: string) {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: async () => {
      if (!query || query.length < 1) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .in('status', ['active', 'out_of_stock'])
        .not('admin_selling_price', 'is', null)
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(20);
      
      if (error) throw error;
      return data as (Product & { category: Category; vendor?: { business_name: string } })[];
    },
    enabled: query.length >= 1,
  });
}

export function useProductSuggestions(query: string) {
  return useQuery({
    queryKey: ['products', 'suggestions', query],
    queryFn: async () => {
      if (!query || query.length < 1) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .in('status', ['active', 'out_of_stock'])
        .not('admin_selling_price', 'is', null)
        .or(`name.ilike.%${query}%`)
        .limit(5);
      
      if (error) throw error;
      return data as (Product & { category: Category; vendor?: { business_name: string } })[];
    },
    enabled: query.length >= 1,
  });
}

export function useRelatedProducts(categoryId: string | undefined, currentProductId: string | undefined) {
  return useQuery({
    queryKey: ['products', 'related', categoryId, currentProductId],
    queryFn: async () => {
      if (!categoryId) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('category_id', categoryId)
        .neq('id', currentProductId || '') 
        .in('status', ['active', 'out_of_stock'])
        .not('admin_selling_price', 'is', null)
        .limit(10);
      
      if (error) throw error;
      return data as (Product & { category: Category; vendor?: { business_name: string } })[];
    },
    enabled: !!categoryId,
  });
}
