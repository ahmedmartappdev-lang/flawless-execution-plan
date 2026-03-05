import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type DeliveryAssignmentMode = 'auto' | 'manual';

export function useDeliveryAssignmentMode() {
  const queryClient = useQueryClient();

  const { data: mode, isLoading } = useQuery({
    queryKey: ['app-settings', 'delivery_assignment_mode'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings' as any)
        .select('value')
        .eq('key', 'delivery_assignment_mode')
        .single();

      if (error) {
        console.error('Failed to fetch delivery assignment mode:', error);
        return 'auto' as DeliveryAssignmentMode;
      }

      return (data as any)?.value as DeliveryAssignmentMode || 'auto';
    },
  });

  const updateModeMutation = useMutation({
    mutationFn: async (newMode: DeliveryAssignmentMode) => {
      const { error } = await supabase
        .from('app_settings' as any)
        .update({
          value: newMode,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('key', 'delivery_assignment_mode');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings', 'delivery_assignment_mode'] });
    },
  });

  return {
    mode: mode || 'auto',
    isAutoMode: (mode || 'auto') === 'auto',
    isManualMode: (mode || 'auto') === 'manual',
    isLoading,
    updateMode: updateModeMutation.mutate,
    isUpdating: updateModeMutation.isPending,
  };
}
