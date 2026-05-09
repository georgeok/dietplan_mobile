import { z } from 'zod';
import { randomUUID as expoRandomUUID } from 'expo-crypto';
import { NUTRIENT_KEYS, type NutrientKey } from '@/lib/foods/nutrients';

// ─── Snapshot schema (v2) ──────────────────────────────────────────────────

const PRIMARY_SNAPSHOT_KEYS = ['kcal', 'proteinG', 'carbsG', 'fatG'] as const;
type PrimarySnapshotKey = (typeof PRIMARY_SNAPSHOT_KEYS)[number];
type ExtendedSnapshotKey = Exclude<NutrientKey, PrimarySnapshotKey>;
const EXTENDED_SNAPSHOT_KEYS = NUTRIENT_KEYS.filter(
  (k): k is ExtendedSnapshotKey =>
    !(PRIMARY_SNAPSHOT_KEYS as readonly string[]).includes(k),
);

const extendedMacrosShape = EXTENDED_SNAPSHOT_KEYS.reduce(
  (acc, key) => {
    acc[key] = z.number().nullable().optional();
    return acc;
  },
  {} as Record<ExtendedSnapshotKey, z.ZodOptional<z.ZodNullable<z.ZodNumber>>>,
);

const macrosSchema = z
  .object({
    kcal: z.number().nullable(),
    proteinG: z.number().nullable(),
    carbsG: z.number().nullable(),
    fatG: z.number().nullable(),
    ...extendedMacrosShape,
  })
  .passthrough();

const snapshotIngredientSchema = z
  .object({
    snapshotIngredientId: z.string().uuid(),
    name: z.string(),
    quantity: z.number().nullable(),
    unit: z.string().nullable(),
    sortOrder: z.number().int(),
  })
  .merge(macrosSchema);

const snapshotAlternativeSchema = z
  .object({
    snapshotAlternativeId: z.string().uuid(),
    name: z.string(),
    quantity: z.number().nullable(),
    unit: z.string().nullable(),
    sortOrder: z.number().int(),
  })
  .merge(macrosSchema);

const snapshotRecipeSchema = z
  .object({
    snapshotRecipeId: z.string().uuid(),
    name: z.string(),
    quantity: z.number().nullable(),
    unit: z.string().nullable(),
    sortOrder: z.number().int(),
    ingredients: z.array(snapshotIngredientSchema),
    alternatives: z.array(snapshotAlternativeSchema),
  })
  .merge(macrosSchema);

const snapshotMealSchema = z.object({
  label: z.string(),
  sortOrder: z.number().int(),
  recipes: z.array(snapshotRecipeSchema),
});

const snapshotDaySchema = z.object({
  dayNumber: z.number().int().positive(),
  meals: z.array(snapshotMealSchema),
});

export const planSnapshotSchema = z.object({
  version: z.literal(2),
  templateId: z.string().uuid().nullable(),
  templateName: z.string(),
  cycleDays: z.number().int().positive(),
  days: z.array(snapshotDaySchema),
});

export const planSnapshotRevisionSchema = z.object({
  snapshot: planSnapshotSchema,
  created_at: z.string(),
});

export type PlanSnapshot = z.infer<typeof planSnapshotSchema>;
export type SnapshotDay = PlanSnapshot['days'][number];
export type SnapshotMeal = SnapshotDay['meals'][number];
export type SnapshotRecipe = SnapshotMeal['recipes'][number];
export type SnapshotIngredient = SnapshotRecipe['ingredients'][number];
export type SnapshotAlternative = SnapshotRecipe['alternatives'][number];
export type PlanSnapshotRevision = z.infer<typeof planSnapshotRevisionSchema>;

// ─── v1 → v2 lifter ────────────────────────────────────────────────────────

type LegacyV1Snapshot = {
  version: 1;
  templateId: string | null;
  templateName: string;
  cycleDays: number;
  days: Array<{
    dayNumber: number;
    meals: Array<{
      label: string;
      sortOrder: number;
      items: Array<{
        snapshotItemId: string;
        name: string;
        quantity: number | null;
        unit: string | null;
        kcal: number | null;
        proteinG: number | null;
        carbsG: number | null;
        fatG: number | null;
        sortOrder: number;
        alternatives: SnapshotAlternative[];
      }>;
    }>;
  }>;
};

function liftV1IfNeeded(raw: unknown): PlanSnapshot {
  const obj = raw as { version?: number };
  if (obj && obj.version === 2) return raw as PlanSnapshot;
  if (!obj || obj.version !== 1) return raw as PlanSnapshot;
  const v1 = raw as LegacyV1Snapshot;
  return {
    version: 2,
    templateId: v1.templateId,
    templateName: v1.templateName,
    cycleDays: v1.cycleDays,
    days: v1.days.map((d) => ({
      dayNumber: d.dayNumber,
      meals: d.meals.map((m) => ({
        label: m.label,
        sortOrder: m.sortOrder,
        recipes: m.items.map((i) => ({
          snapshotRecipeId: i.snapshotItemId,
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          kcal: i.kcal,
          proteinG: i.proteinG,
          carbsG: i.carbsG,
          fatG: i.fatG,
          sortOrder: i.sortOrder,
          ingredients: [],
          alternatives: i.alternatives,
        })),
      })),
    })),
  };
}

// ─── Lookups ───────────────────────────────────────────────────────────────

export function findSnapshotRecipe(
  snapshot: PlanSnapshot,
  snapshotRecipeId: string,
): { day: SnapshotDay; meal: SnapshotMeal; recipe: SnapshotRecipe } | null {
  for (const day of snapshot.days) {
    for (const meal of day.meals) {
      for (const recipe of meal.recipes) {
        if (recipe.snapshotRecipeId === snapshotRecipeId) {
          return { day, meal, recipe };
        }
      }
    }
  }
  return null;
}

export function effectiveSnapshot(
  plan: { snapshot: PlanSnapshot; revisions?: PlanSnapshotRevision[] | null },
): PlanSnapshot {
  const revs = plan.revisions ?? [];
  if (revs.length > 0) return liftV1IfNeeded(revs[revs.length - 1]!.snapshot);
  return liftV1IfNeeded(plan.snapshot);
}

export function findSnapshotRecipeAnyRevision(
  plan: { snapshot: PlanSnapshot; revisions?: PlanSnapshotRevision[] | null },
  snapshotRecipeId: string,
): { day: SnapshotDay; meal: SnapshotMeal; recipe: SnapshotRecipe } | null {
  const inV0 = findSnapshotRecipe(liftV1IfNeeded(plan.snapshot), snapshotRecipeId);
  if (inV0) return inV0;
  for (const rev of plan.revisions ?? []) {
    const found = findSnapshotRecipe(liftV1IfNeeded(rev.snapshot), snapshotRecipeId);
    if (found) return found;
  }
  return null;
}

export function snapshotMealLabelsByRecipeId(
  plan: { snapshot: PlanSnapshot; revisions?: PlanSnapshotRevision[] | null },
): Map<string, string> {
  const out = new Map<string, string>();
  const sources: unknown[] = [plan.snapshot];
  for (const rev of plan.revisions ?? []) sources.push(rev.snapshot);
  for (const raw of sources) {
    const snap = liftV1IfNeeded(raw);
    for (const day of snap.days) {
      for (const meal of day.meals) {
        for (const recipe of meal.recipes) {
          if (!out.has(recipe.snapshotRecipeId)) {
            out.set(recipe.snapshotRecipeId, meal.label);
          }
        }
      }
    }
  }
  return out;
}

export function newSnapshotId(): string {
  return expoRandomUUID();
}
