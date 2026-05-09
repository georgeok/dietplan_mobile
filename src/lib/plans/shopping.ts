import type { ClientPlan, FoodCategory, Tick } from '@/lib/database.types';
import type { SnapshotIngredient, SnapshotRecipe } from '@/lib/plans/snapshot';
import { effectiveSnapshot } from '@/lib/plans/snapshot';
import { normalizeFoodName } from '@/lib/plans/normalize';

export type ShoppingItem = {
  name: string;
  normalized: string;
  quantity: number | null;
  unit: string | null;
  occurrences: number;
};

export function aggregateShoppingItems(
  plan: ClientPlan,
  ticks: Tick[],
): ShoppingItem[] {
  const snapshot = effectiveSnapshot(plan);
  const tickedRecipeIds = new Set(ticks.map((t) => t.snapshot_recipe_id));
  const buckets = new Map<string, ShoppingItem>();
  for (const day of snapshot.days) {
    const dayRecipes = day.meals.flatMap((m) => m.recipes);
    if (dayRecipes.length === 0) continue;
    const allTracked = dayRecipes.every((r) => tickedRecipeIds.has(r.snapshotRecipeId));
    if (allTracked) continue;
    for (const meal of day.meals) {
      for (const recipe of meal.recipes) {
        if (tickedRecipeIds.has(recipe.snapshotRecipeId)) continue;
        if (recipe.ingredients.length > 0) {
          for (const ing of recipe.ingredients) addIngredient(buckets, ing);
        } else {
          addRecipeAsLine(buckets, recipe);
        }
      }
    }
  }
  return [...buckets.values()].sort((a, b) => a.name.localeCompare(b.name, 'el'));
}

function addIngredient(buckets: Map<string, ShoppingItem>, ing: SnapshotIngredient) {
  add(buckets, ing.name, ing.quantity, ing.unit);
}

function addRecipeAsLine(buckets: Map<string, ShoppingItem>, recipe: SnapshotRecipe) {
  add(buckets, recipe.name, recipe.quantity, recipe.unit);
}

function add(
  buckets: Map<string, ShoppingItem>,
  name: string,
  quantity: number | null,
  unit: string | null,
) {
  const normalized = normalizeFoodName(name);
  if (!normalized) return;
  const key = `${normalized} ${unit ?? ''}`;
  const existing = buckets.get(key);
  if (existing) {
    if (existing.quantity !== null && quantity !== null) existing.quantity += quantity;
    else if (quantity !== null) existing.quantity = quantity;
    existing.occurrences += 1;
    return;
  }
  buckets.set(key, { name, normalized, quantity, unit, occurrences: 1 });
}

export type ShoppingGroup = { category: FoodCategory; items: ShoppingItem[] };

export function formatItemDetail(item: ShoppingItem): string {
  if (item.quantity === null) {
    return item.occurrences > 1 ? `× ${item.occurrences}` : '';
  }
  const qty = Number.isInteger(item.quantity)
    ? String(item.quantity)
    : item.quantity.toFixed(1);
  return item.unit ? `${qty} ${item.unit}` : qty;
}

const CATEGORY_ORDER: FoodCategory[] = ['produce', 'dairy', 'grains', 'protein', 'other'];

export function groupShoppingItems(
  items: ShoppingItem[],
  categories: Map<string, FoodCategory>,
): ShoppingGroup[] {
  const grouped = new Map<FoodCategory, ShoppingItem[]>();
  for (const cat of CATEGORY_ORDER) grouped.set(cat, []);
  for (const item of items) {
    const cat = categories.get(item.name) ?? 'other';
    grouped.get(cat)!.push(item);
  }
  return CATEGORY_ORDER.filter((c) => grouped.get(c)!.length > 0).map((category) => ({
    category,
    items: grouped.get(category)!,
  }));
}
