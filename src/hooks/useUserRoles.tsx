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
 * Helper function to link user_id to a role record.
 * Called in the background when a user is found by email but not by user_id.
 */
async function linkUserIdToRole(
  table: 'admins' | 'vendors' | 'delivery_partners',
  recordId: string,
  userId: string
) {
  try {
    await supabase
      .from(table)
      .update({ user_id: userId })
      .eq('id', recordId)
      .is('user_id', null);
    console.log(`Linked user_id ${userId} to ${table} record ${recordId}`);
  } catch (error) {
    console.error(`Failed to link user_id to ${table}:`, error);
  }
}

/**
 * Hook to determine user roles based on presence in role-specific tables.
 * Checks by user_id first, then falls back to email lookup for pre-populated users.
 * Auto-links user_id when found by email for future lookups.
 */
export function useUserRoles(): UserRolesData {
  const { user } = useAuthStore();

  // Check if user is an admin
  const { data: adminData, isLoading: adminLoading } = useQuery({
    queryKey: ['user-admin-status', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Try by user_id first
      let { data, error } = await supabase
        .from('admins')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking admin status by user_id:', error);
      }
      
      // Fallback: try by email if no result
      if (!data && user.email) {
        const emailResult = await supabase
          .from('admins')
          .select('id, status')
          .eq('email', user.email.toLowerCase())
          .maybeSingle();
        
        if (emailResult.error) {
          console.error('Error checking admin status by email:', emailResult.error);
        }
        
        if (emailResult.data) {
          data = emailResult.data;
          // Link user_id in background for future lookups
          linkUserIdToRole('admins', emailResult.data.id, user.id);
        }
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  // Check if user is a vendor
  const { data: vendorData, isLoading: vendorLoading } = useQuery({
    queryKey: ['user-vendor-status', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Try by user_id first
      let { data, error } = await supabase
        .from('vendors')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking vendor status by user_id:', error);
      }
      
      // Fallback: try by email if no result
      if (!data && user.email) {
        const emailResult = await supabase
          .from('vendors')
          .select('id, status')
          .eq('email', user.email.toLowerCase())
          .maybeSingle();
        
        if (emailResult.error) {
          console.error('Error checking vendor status by email:', emailResult.error);
        }
        
        if (emailResult.data) {
          data = emailResult.data;
          // Link user_id in background for future lookups
          linkUserIdToRole('vendors', emailResult.data.id, user.id);
        }
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  // Check if user is a delivery partner
  const { data: deliveryData, isLoading: deliveryLoading } = useQuery({
    queryKey: ['user-delivery-status', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Try by user_id first
      let { data, error } = await supabase
        .from('delivery_partners')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking delivery partner status by user_id:', error);
      }
      
      // Fallback: try by email if no result
      if (!data && user.email) {
        const emailResult = await supabase
          .from('delivery_partners')
          .select('id')
          .eq('email', user.email.toLowerCase())
          .maybeSingle();
        
        if (emailResult.error) {
          console.error('Error checking delivery partner status by email:', emailResult.error);
        }
        
        if (emailResult.data) {
          data = emailResult.data;
          // Link user_id in background for future lookups
          linkUserIdToRole('delivery_partners', emailResult.data.id, user.id);
        }
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
