import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useSetMealNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      planId: string;
      cycleDay: number;
      mealLabel: string;
      body: string;
    }) => {
      const trimmed = input.body.trim();
      if (!trimmed) {
        const { error } = await supabase
          .from('meal_notes')
          .delete()
          .eq('client_plan_id', input.planId)
          .eq('cycle_day', input.cycleDay)
          .eq('meal_label', input.mealLabel);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from('meal_notes').upsert(
        {
          client_plan_id: input.planId,
          cycle_day: input.cycleDay,
          meal_label: input.mealLabel,
          body: trimmed,
        },
        { onConflict: 'client_plan_id,cycle_day,meal_label' },
      );
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['mealNotes', vars.planId] });
    },
  });
}
