import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export function useUserRoles() {
  const { user } = useAuthStore();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data.map(r => r.role);
    },
    enabled: !!user?.id,
  });

  const hasRole = (role: AppRole) => roles.includes(role);
  
  return {
    roles,
    isLoading,
    hasRole,
    isAdmin: hasRole('admin'),
    isVendor: hasRole('vendor'),
    isDeliveryPartner: hasRole('delivery_partner'),
    isCustomer: hasRole('customer'),
  };
}
