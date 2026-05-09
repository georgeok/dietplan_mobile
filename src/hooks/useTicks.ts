import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Tick } from '@/lib/database.types';

export function useTicks(planId: string | null) {
  return useQuery({
    queryKey: ['ticks', planId],
    enabled: !!planId,
    queryFn: async (): Promise<Tick[]> => {
      if (!planId) return [];
      const { data, error } = await supabase
        .from('ticks')
        .select('*')
        .eq('client_plan_id', planId);
      if (error) throw error;
      return data ?? [];
    },
  });
}
