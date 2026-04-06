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

function getPhoneCandidates(phone?: string | null): string[] {
  if (!phone) return [];

  const digits = phone.replace(/\D/g, '');
  const candidates = new Set<string>();

  if (digits.length === 10) {
    candidates.add(digits);
    candidates.add(`+91${digits}`);
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    const localNumber = digits.slice(2);
    candidates.add(localNumber);
    candidates.add(`+${digits}`);
  }

  candidates.add(phone);

  return Array.from(candidates);
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

async function findAdminRecord(user: { id: string; email?: string | null; phone?: string | null }) {
  let { data, error } = await supabase
    .from('admins')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error checking admins status by user_id:', error);
  }

  if (!data) {
    for (const phone of getPhoneCandidates(user.phone)) {
      const phoneResult = await supabase
        .from('admins')
        .select('id, status')
        .eq('phone', phone)
        .maybeSingle();

      if (phoneResult.error) {
        console.error('Error checking admins status by phone:', phoneResult.error);
        continue;
      }

      if (phoneResult.data) {
        data = phoneResult.data;
        linkUserIdToRole('admins', phoneResult.data.id, user.id);
        break;
      }
    }
  }

  if (!data && user.email) {
    const emailResult = await supabase
      .from('admins')
      .select('id, status')
      .eq('email', user.email.toLowerCase())
      .maybeSingle();

    if (emailResult.error) {
      console.error('Error checking admins status by email:', emailResult.error);
    }

    if (emailResult.data) {
      data = emailResult.data;
      linkUserIdToRole('admins', emailResult.data.id, user.id);
    }
  }

  return data;
}

async function findVendorRecord(user: { id: string; email?: string | null; phone?: string | null }) {
  let { data, error } = await supabase
    .from('vendors')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error checking vendors status by user_id:', error);
  }

  if (!data) {
    for (const phone of getPhoneCandidates(user.phone)) {
      const phoneResult = await supabase
        .from('vendors')
        .select('id, status')
        .eq('phone', phone)
        .maybeSingle();

      if (phoneResult.error) {
        console.error('Error checking vendors status by phone:', phoneResult.error);
        continue;
      }

      if (phoneResult.data) {
        data = phoneResult.data;
        linkUserIdToRole('vendors', phoneResult.data.id, user.id);
        break;
      }
    }
  }

  if (!data && user.email) {
    const emailResult = await supabase
      .from('vendors')
      .select('id, status')
      .eq('email', user.email.toLowerCase())
      .maybeSingle();

    if (emailResult.error) {
      console.error('Error checking vendors status by email:', emailResult.error);
    }

    if (emailResult.data) {
      data = emailResult.data;
      linkUserIdToRole('vendors', emailResult.data.id, user.id);
    }
  }

  return data;
}

async function findDeliveryPartnerRecord(user: { id: string; email?: string | null; phone?: string | null }) {
  let { data, error } = await supabase
    .from('delivery_partners')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error checking delivery_partners status by user_id:', error);
  }

  if (!data) {
    for (const phone of getPhoneCandidates(user.phone)) {
      const phoneResult = await supabase
        .from('delivery_partners')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();

      if (phoneResult.error) {
        console.error('Error checking delivery_partners status by phone:', phoneResult.error);
        continue;
      }

      if (phoneResult.data) {
        data = phoneResult.data;
        linkUserIdToRole('delivery_partners', phoneResult.data.id, user.id);
        break;
      }
    }
  }

  if (!data && user.email) {
    const emailResult = await supabase
      .from('delivery_partners')
      .select('id')
      .eq('email', user.email.toLowerCase())
      .maybeSingle();

    if (emailResult.error) {
      console.error('Error checking delivery_partners status by email:', emailResult.error);
    }

    if (emailResult.data) {
      data = emailResult.data;
      linkUserIdToRole('delivery_partners', emailResult.data.id, user.id);
    }
  }

  return data;
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
    queryKey: ['user-admin-status', user?.id, user?.email, user?.phone],
    queryFn: async () => {
      if (!user?.id) return null;

      return findAdminRecord(user);
    },
    enabled: !!user?.id,
  });

  // Check if user is a vendor
  const { data: vendorData, isLoading: vendorLoading } = useQuery({
    queryKey: ['user-vendor-status', user?.id, user?.email, user?.phone],
    queryFn: async () => {
      if (!user?.id) return null;

      return findVendorRecord(user);
    },
    enabled: !!user?.id,
  });

  // Check if user is a delivery partner
  const { data: deliveryData, isLoading: deliveryLoading } = useQuery({
    queryKey: ['user-delivery-status', user?.id, user?.email, user?.phone],
    queryFn: async () => {
      if (!user?.id) return null;

      return findDeliveryPartnerRecord(user);
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
