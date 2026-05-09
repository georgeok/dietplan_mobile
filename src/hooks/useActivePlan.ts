import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ClientPlan } from '@/lib/database.types';

export type ActivePlanResult = {
  active: ClientPlan | null;
  upcoming: ClientPlan | null;
};

export function useActivePlan(clientId: string | null) {
  return useQuery({
    queryKey: ['activePlan', clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<ActivePlanResult> => {
      if (!clientId) return { active: null, upcoming: null };
      const { data, error } = await supabase
        .from('client_plans')
        .select('*')
        .eq('client_id', clientId)
        .in('status', ['active', 'upcoming']);
      if (error) throw error;
      return {
        active: (data ?? []).find((p) => p.status === 'active') ?? null,
        upcoming: (data ?? []).find((p) => p.status === 'upcoming') ?? null,
      };
    },
  });
}
