import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { WeightLog } from '@/lib/database.types';

export function useWeightLogs(clientId: string | null) {
  return useQuery({
    queryKey: ['weightLogs', clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<WeightLog[]> => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('client_id', clientId)
        .order('logged_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLogWeight(clientId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { kg: number; loggedAt?: string }) => {
      if (!clientId) throw new Error('no client');
      const { error } = await supabase.from('weight_logs').insert({
        client_id: clientId,
        kg: input.kg,
        logged_at: input.loggedAt ?? new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weightLogs', clientId] }),
  });
}

export function useDeleteWeight(clientId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('weight_logs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weightLogs', clientId] }),
  });
}
