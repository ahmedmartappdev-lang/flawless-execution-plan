import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useFeaturedStores() {
  return useQuery({
    queryKey: ['featured-stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, business_name, owner_photo_url, store_photo_url, store_address, rating')
        .eq('status', 'active')
        .eq('is_accepting_orders', true)
        .order('rating', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data || [];
    },
  });
}
