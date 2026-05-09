import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ClientPlan, Tick } from '@/lib/database.types';
import { effectiveSnapshot } from '@/lib/plans/snapshot';

export function useTrackAllUntracked(clientId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      plan: ClientPlan;
      cycleDay: number;
      existingTicks: Tick[];
    }) => {
      const snapshot = effectiveSnapshot(input.plan);
      const day = snapshot.days.find((d) => d.dayNumber === input.cycleDay);
      if (!day) return;
      const ticked = new Set(
        input.existingTicks
          .filter((t) => t.cycle_day === input.cycleDay)
          .map((t) => t.snapshot_recipe_id),
      );
      const inserts = day.meals
        .flatMap((m) => m.recipes)
        .filter((r) => !ticked.has(r.snapshotRecipeId))
        .map((r) => ({
          client_plan_id: input.plan.id,
          snapshot_recipe_id: r.snapshotRecipeId,
          cycle_day: input.cycleDay,
          status: 'eaten' as const,
          eaten_at: new Date().toISOString(),
        }));
      if (inserts.length === 0) return;
      const { error } = await supabase
        .from('ticks')
        .upsert(inserts, { onConflict: 'client_plan_id,snapshot_recipe_id', ignoreDuplicates: true });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['ticks', vars.plan.id] });
      qc.invalidateQueries({ queryKey: ['shoppingList', vars.plan.id] });
      qc.invalidateQueries({ queryKey: ['activePlan', clientId] });
    },
  });
}
