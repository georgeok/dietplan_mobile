import type { ClientPlan, Tick } from '@/lib/database.types';
import {
  effectiveSnapshot,
  snapshotMealLabelsByRecipeId,
} from '@/lib/plans/snapshot';

export type ComplianceWindow = {
  eaten: number;
  total: number;
  percent: number | null;
};

export type PlanProgress = {
  eaten: number;
  partial: number;
  skipped: number;
  totalRecipes: number;
  daysFullyTracked: number;
  daysTracked: number;
  totalDays: number;
};

export function planProgress(plan: ClientPlan, ticks: Tick[]): PlanProgress {
  const snapshot = effectiveSnapshot(plan);
  const tickedRecipeIds = new Set(ticks.map((t) => t.snapshot_recipe_id));

  let eaten = 0;
  let partial = 0;
  let skipped = 0;
  const trackedDays = new Set<number>();
  for (const t of ticks) {
    if (t.status === 'eaten') eaten += 1;
    else if (t.status === 'partial') partial += 1;
    else if (t.status === 'skipped') skipped += 1;
    trackedDays.add(t.cycle_day);
  }

  let totalRecipes = 0;
  let daysFullyTracked = 0;
  for (const day of snapshot.days) {
    let dayRecipes = 0;
    let dayTracked = 0;
    for (const meal of day.meals) {
      for (const recipe of meal.recipes) {
        dayRecipes += 1;
        if (tickedRecipeIds.has(recipe.snapshotRecipeId)) dayTracked += 1;
      }
    }
    totalRecipes += dayRecipes;
    if (dayRecipes > 0 && dayTracked === dayRecipes) daysFullyTracked += 1;
  }

  return {
    eaten,
    partial,
    skipped,
    totalRecipes,
    daysFullyTracked,
    daysTracked: trackedDays.size,
    totalDays: snapshot.days.length,
  };
}

export function complianceByMeal(
  plan: ClientPlan,
  ticks: Tick[],
): Map<string, ComplianceWindow> {
  const snapshot = effectiveSnapshot(plan);
  const totals = new Map<string, number>();
  for (const day of snapshot.days) {
    for (const meal of day.meals) {
      totals.set(meal.label, (totals.get(meal.label) ?? 0) + meal.recipes.length);
    }
  }
  const labelByRecipe = snapshotMealLabelsByRecipeId(plan);
  const eatens = new Map<string, number>();
  for (const tick of ticks) {
    if (tick.status !== 'eaten') continue;
    const label = labelByRecipe.get(tick.snapshot_recipe_id);
    if (label === undefined) continue;
    eatens.set(label, (eatens.get(label) ?? 0) + 1);
  }
  const result = new Map<string, ComplianceWindow>();
  for (const [label, total] of totals) {
    const eaten = eatens.get(label) ?? 0;
    result.set(label, { eaten, total, percent: total === 0 ? null : eaten / total });
  }
  return result;
}

/**
 * Per-day compliance ratio: eaten + 0.5 × partial / scheduled-recipes.
 * Used by the day-selector dots and the day card's progress ring.
 */
export function dayCompliance(
  plan: ClientPlan,
  cycleDay: number,
  ticks: Tick[],
): { eaten: number; partial: number; skipped: number; total: number; percent: number } {
  const snapshot = effectiveSnapshot(plan);
  const day = snapshot.days.find((d) => d.dayNumber === cycleDay);
  if (!day) return { eaten: 0, partial: 0, skipped: 0, total: 0, percent: 0 };
  const recipeIds = new Set<string>();
  for (const meal of day.meals) {
    for (const r of meal.recipes) recipeIds.add(r.snapshotRecipeId);
  }
  let eaten = 0;
  let partial = 0;
  let skipped = 0;
  for (const t of ticks) {
    if (t.cycle_day !== cycleDay) continue;
    if (!recipeIds.has(t.snapshot_recipe_id)) continue;
    if (t.status === 'eaten') eaten += 1;
    else if (t.status === 'partial') partial += 1;
    else if (t.status === 'skipped') skipped += 1;
  }
  const total = recipeIds.size;
  const percent = total === 0 ? 0 : Math.round(((eaten + partial * 0.5) / total) * 100);
  return { eaten, partial, skipped, total, percent };
}

export function lastActivity(ticks: Tick[]): string | null {
  let latest: string | null = null;
  for (const t of ticks) {
    if (latest === null || t.eaten_at > latest) latest = t.eaten_at;
  }
  return latest;
}

export function hoursSince(iso: string, now: Date = new Date()): number {
  return (now.getTime() - new Date(iso).getTime()) / 3_600_000;
}
