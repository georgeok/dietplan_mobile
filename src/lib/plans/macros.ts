import type { ClientPlan, Tick } from '@/lib/database.types';
import {
  findSnapshotRecipeAnyRevision,
  type SnapshotDay,
  type SnapshotMeal,
  type SnapshotIngredient,
  type SnapshotRecipe,
  type SnapshotAlternative,
} from '@/lib/plans/snapshot';
import { NUTRIENT_KEYS, type NutrientKey } from '@/lib/foods/nutrients';

export type DailyMacros = { [K in NutrientKey]: number };

const ZERO: DailyMacros = NUTRIENT_KEYS.reduce(
  (acc, key) => {
    acc[key] = 0;
    return acc;
  },
  {} as DailyMacros,
);

export const ZERO_DAILY_MACROS: DailyMacros = Object.freeze({ ...ZERO });

function freshZero(): DailyMacros {
  return { ...ZERO };
}

export type MacroSource = { [K in NutrientKey]?: number | null };

function addMacros(out: DailyMacros, source: MacroSource): DailyMacros {
  const next = { ...out };
  for (const key of NUTRIENT_KEYS) next[key] = next[key] + (source[key] ?? 0);
  return next;
}

function recipeHasOwnMacros(r: MacroSource): boolean {
  for (const key of NUTRIENT_KEYS) {
    const v = r[key];
    if (v !== null && v !== undefined) return true;
  }
  return false;
}

function sumIngredients(ings: SnapshotIngredient[]): MacroSource {
  const acc: { [K in NutrientKey]?: number | null } = {};
  for (const key of NUTRIENT_KEYS) acc[key] = 0;
  for (const i of ings) {
    for (const key of NUTRIENT_KEYS) {
      const v = (i as MacroSource)[key];
      acc[key] = (acc[key] ?? 0) + (v ?? 0);
    }
  }
  return acc;
}

export function recipeMacros(recipe: SnapshotRecipe): DailyMacros {
  if (recipe.ingredients.length > 0) return coerce(sumIngredients(recipe.ingredients));
  return coerce(recipe as MacroSource);
}

function coerce(source: MacroSource): DailyMacros {
  const out = freshZero();
  for (const key of NUTRIENT_KEYS) out[key] = source[key] ?? 0;
  return out;
}

export function mealMacros(meal: SnapshotMeal): DailyMacros {
  return meal.recipes.reduce<DailyMacros>(
    (acc, r) => addMacros(acc, recipeMacros(r)),
    freshZero(),
  );
}

export function dayMacros(day: SnapshotDay): DailyMacros {
  return day.meals.reduce<DailyMacros>(
    (acc, m) => addMacros(acc, mealMacros(m)),
    freshZero(),
  );
}

function zeroSource(): MacroSource {
  const out: MacroSource = {};
  for (const key of NUTRIENT_KEYS) out[key] = 0;
  return out;
}

function scaleSource(source: MacroSource, factor: number): MacroSource {
  const out: MacroSource = {};
  for (const key of NUTRIENT_KEYS) {
    const v = source[key];
    out[key] = v === null || v === undefined ? null : v * factor;
  }
  return out;
}

export function tickMacros(plan: ClientPlan, tick: Tick): MacroSource {
  if (tick.status === 'skipped') return zeroSource();
  const found = findSnapshotRecipeAnyRevision(plan, tick.snapshot_recipe_id);
  if (!found) return zeroSource();
  const recipe = found.recipe;
  const altSource: SnapshotAlternative | null = tick.snapshot_alternative_id
    ? recipe.alternatives.find(
        (a) => a.snapshotAlternativeId === tick.snapshot_alternative_id,
      ) ?? null
    : null;
  if (tick.status === 'eaten') {
    if (altSource) return altSource as MacroSource;
    if (recipe.ingredients.length > 0) return sumIngredients(recipe.ingredients);
    return recipe as MacroSource;
  }
  if (recipe.ingredients.length > 0) {
    const eatenIds = new Set(tick.ingredients_eaten ?? []);
    const eaten = recipe.ingredients.filter((i) =>
      eatenIds.has(i.snapshotIngredientId),
    );
    return sumIngredients(eaten);
  }
  const base: SnapshotRecipe | SnapshotAlternative = altSource ?? recipe;
  if (!recipeHasOwnMacros(base)) return zeroSource();
  return scaleSource(base, 0.5);
}

export function ticksMacros(plan: ClientPlan, ticks: Tick[]): DailyMacros {
  let out = freshZero();
  for (const tick of ticks) out = addMacros(out, tickMacros(plan, tick));
  return out;
}
