import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { MealNote } from '@/lib/database.types';

export function useMealNotes(planId: string | null) {
  return useQuery({
    queryKey: ['mealNotes', planId],
    enabled: !!planId,
    queryFn: async (): Promise<MealNote[]> => {
      if (!planId) return [];
      const { data, error } = await supabase
        .from('meal_notes')
        .select('*')
        .eq('client_plan_id', planId);
      if (error) throw error;
      return data ?? [];
    },
  });
}
