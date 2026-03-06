import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

export function useCustomerCredits() {
  const { user } = useAuthStore();

  const { data: creditBalance = 0, isLoading: balanceLoading } = useQuery({
    queryKey: ['customer-credit-balance', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { data } = await supabase
        .from('profiles')
        .select('credit_balance')
        .eq('user_id', user.id)
        .single();
      return Number(data?.credit_balance || 0);
    },
    enabled: !!user?.id,
  });

  const { data: creditHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['customer-credit-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase
        .from('customer_credit_transactions') as any)
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  return {
    creditBalance,
    creditHistory,
    isLoading: balanceLoading || historyLoading,
  };
}
