import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

interface UserRolesData {
  isAdmin: boolean;
  isVendor: boolean;
  isDeliveryPartner: boolean;
  isCustomer: boolean;
  isLoading: boolean;
  vendorId: string | null;
  deliveryPartnerId: string | null;
  adminId: string | null;
}

/**
 * Hook to determine user roles based on presence in role-specific tables.
 * No longer depends on user_roles table.
 */
export function useUserRoles(): UserRolesData {
  const { user } = useAuthStore();

  // Check if user is an admin
  const { data: adminData, isLoading: adminLoading } = useQuery({
    queryKey: ['user-admin-status', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('admins')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking admin status:', error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
  });

  // Check if user is a vendor
  const { data: vendorData, isLoading: vendorLoading } = useQuery({
    queryKey: ['user-vendor-status', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('vendors')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking vendor status:', error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
  });

  // Check if user is a delivery partner
  const { data: deliveryData, isLoading: deliveryLoading } = useQuery({
    queryKey: ['user-delivery-status', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('delivery_partners')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking delivery partner status:', error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const isLoading = adminLoading || vendorLoading || deliveryLoading;
  
  const isAdmin = !!adminData && adminData.status === 'active';
  const isVendor = !!vendorData && vendorData.status === 'active';
  const isDeliveryPartner = !!deliveryData;
  
  // Customer = authenticated user not in any other role table
  const isCustomer = !!user && !isAdmin && !isVendor && !isDeliveryPartner;

  return {
    isAdmin,
    isVendor,
    isDeliveryPartner,
    isCustomer,
    isLoading,
    adminId: adminData?.id || null,
    vendorId: vendorData?.id || null,
    deliveryPartnerId: deliveryData?.id || null,
  };
}
