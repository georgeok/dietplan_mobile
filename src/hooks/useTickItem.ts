import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { TickStatus } from '@/lib/database.types';

export type TickItemInput = {
  planId: string;
  cycleDay: number;
  snapshotRecipeId: string;
  status: TickStatus;
  snapshotAlternativeId?: string | null;
  ingredientsEaten?: string[] | null;
  note?: string | null;
  photoUrl?: string | null;
};

export function useTickItem(clientId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TickItemInput) => {
      const { error } = await supabase
        .from('ticks')
        .upsert(
          {
            client_plan_id: input.planId,
            cycle_day: input.cycleDay,
            snapshot_recipe_id: input.snapshotRecipeId,
            snapshot_alternative_id: input.snapshotAlternativeId ?? null,
            status: input.status,
            ingredients_eaten: input.ingredientsEaten ?? null,
            note: input.note ?? null,
            photo_url: input.photoUrl ?? null,
            eaten_at: new Date().toISOString(),
          },
          { onConflict: 'client_plan_id,snapshot_recipe_id' },
        );
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['ticks', vars.planId] });
      qc.invalidateQueries({ queryKey: ['shoppingList', vars.planId] });
      qc.invalidateQueries({ queryKey: ['activePlan', clientId] });
    },
  });
}

export function useClearTick(clientId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { planId: string; snapshotRecipeId: string }) => {
      const { error } = await supabase
        .from('ticks')
        .delete()
        .eq('client_plan_id', input.planId)
        .eq('snapshot_recipe_id', input.snapshotRecipeId);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['ticks', vars.planId] });
      qc.invalidateQueries({ queryKey: ['shoppingList', vars.planId] });
      qc.invalidateQueries({ queryKey: ['activePlan', clientId] });
    },
  });
}
