import { Pressable, Text, View } from 'react-native';
import type { SnapshotMeal, SnapshotRecipe } from '@/lib/plans/snapshot';
import type { Tick } from '@/lib/database.types';
import { MealIcon } from './MealIcon';
import { StatusPill, type DisplayStatus } from './StatusPill';
import { MealNoteInput } from './MealNoteInput';

function mealStatus(meal: SnapshotMeal, ticksByRecipe: Map<string, Tick>): DisplayStatus {
  const statuses = meal.recipes.map((r) => ticksByRecipe.get(r.snapshotRecipeId)?.status);
  if (statuses.length === 0) return 'pending';
  if (statuses.every((s) => s === 'eaten')) return 'eaten';
  if (statuses.every((s) => s === 'skipped')) return 'skipped';
  if (statuses.every((s) => s === undefined)) return 'pending';
  return 'partial';
}

function recipeDetail(r: SnapshotRecipe): string {
  const parts: string[] = [];
  if (r.quantity !== null) parts.push(`${r.quantity}${r.unit ? ` ${r.unit}` : ''}`);
  if (r.kcal !== null) parts.push(`${Math.round(r.kcal)} kcal`);
  return parts.join(' · ');
}

export function MealSection({
  meal,
  index,
  ticksByRecipe,
  editable,
  noteBody,
  onPressRecipe,
  onSaveNote,
}: {
  meal: SnapshotMeal;
  index: number;
  ticksByRecipe: Map<string, Tick>;
  editable: boolean;
  noteBody: string;
  onPressRecipe: (recipe: SnapshotRecipe, existing: Tick | null) => void;
  onSaveNote: (body: string) => Promise<void> | void;
}) {
  return (
    <View className="border-t border-border px-4 py-3">
      <View className="flex-row items-center gap-2">
        <MealIcon index={index} />
        <Text className="flex-1 text-sm font-semibold text-foreground">{meal.label}</Text>
        <StatusPill status={mealStatus(meal, ticksByRecipe)} />
      </View>

      <View className="mt-2 gap-1.5">
        {meal.recipes.map((r) => {
          const tick = ticksByRecipe.get(r.snapshotRecipeId) ?? null;
          const display: DisplayStatus = tick ? tick.status : 'pending';
          return (
            <Pressable
              key={r.snapshotRecipeId}
              onPress={() => onPressRecipe(r, tick)}
              className="flex-row items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
            >
              <View className="flex-1">
                <Text className="text-sm text-foreground">{r.name}</Text>
                {recipeDetail(r) ? (
                  <Text className="text-xs text-muted-foreground">{recipeDetail(r)}</Text>
                ) : null}
              </View>
              <StatusPill status={display} />
            </Pressable>
          );
        })}
      </View>

      <MealNoteInput initial={noteBody} editable={editable} onSave={onSaveNote} />
    </View>
  );
}
