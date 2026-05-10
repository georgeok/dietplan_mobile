import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ClientPlan, MealNote, Tick } from '@/lib/database.types';
import type { SnapshotDay, SnapshotRecipe } from '@/lib/plans/snapshot';
import { dayCompliance } from '@/lib/plans/compliance';
import { dayMacros, ticksMacros } from '@/lib/plans/macros';
import { ComplianceRing } from './ComplianceRing';
import { DailyMacrosRow } from './DailyMacrosRow';
import { TrackAllButton } from './TrackAllButton';
import { MealSection } from './MealSection';

export function CombinedDayCard({
  plan,
  day,
  totalDays,
  ticks,
  mealNotes,
  editable,
  showMacros,
  onPressRecipe,
  onSaveNote,
  onTrackAll,
}: {
  plan: ClientPlan;
  day: SnapshotDay;
  totalDays: number;
  ticks: Tick[];
  mealNotes: MealNote[];
  editable: boolean;
  showMacros: boolean;
  onPressRecipe: (recipe: SnapshotRecipe, existing: Tick | null) => void;
  onSaveNote: (mealLabel: string, body: string) => Promise<void> | void;
  onTrackAll: () => void;
}) {
  const { t } = useTranslation();
  const dayTicks = ticks.filter((tk) => tk.cycle_day === day.dayNumber);
  const ticksByRecipe = new Map<string, Tick>();
  for (const tk of dayTicks) ticksByRecipe.set(tk.snapshot_recipe_id, tk);
  const comp = dayCompliance(plan, day.dayNumber, ticks);
  const allTracked = comp.total > 0 && comp.eaten + comp.partial + comp.skipped === comp.total;
  const noteByLabel = new Map<string, string>();
  for (const n of mealNotes) {
    if (n.cycle_day === day.dayNumber) noteByLabel.set(n.meal_label, n.body);
  }

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      <View className="bg-emerald-50 p-4 dark:bg-emerald-950">
        <View className="flex-row items-center gap-3">
          <ComplianceRing percent={comp.percent} />
          <View className="flex-1">
            <Text className="text-base font-bold text-foreground">
              {t('week.day', { day: day.dayNumber })}
              <Text className="text-sm font-normal text-muted-foreground">{` / ${totalDays}`}</Text>
            </Text>
            <Text className="text-sm text-muted-foreground">
              {t('week.itemsProgress', { eaten: comp.eaten, total: comp.total })}
            </Text>
          </View>
        </View>
        {showMacros ? (
          <DailyMacrosRow totals={ticksMacros(plan, dayTicks)} planned={dayMacros(day)} />
        ) : null}
        {editable && !allTracked ? (
          <View className="mt-3">
            <TrackAllButton onPress={onTrackAll} />
          </View>
        ) : null}
        {!editable ? (
          <Text className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">
            {t('week.readOnly')}
          </Text>
        ) : null}
      </View>

      {day.meals.map((meal, i) => (
        <MealSection
          key={`${meal.label}-${i}`}
          meal={meal}
          index={i}
          ticksByRecipe={ticksByRecipe}
          editable={editable}
          noteBody={noteByLabel.get(meal.label) ?? ''}
          onPressRecipe={onPressRecipe}
          onSaveNote={(body) => onSaveNote(meal.label, body)}
        />
      ))}
    </View>
  );
}
