import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Client } from '@/lib/database.types';

export function useClientProfile(clientId: string | null) {
  return useQuery({
    queryKey: ['clientProfile', clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<Client | null> => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}
