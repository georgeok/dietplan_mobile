import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useClientProfile } from '@/hooks/useClientProfile';
import { useActivePlan } from '@/hooks/useActivePlan';
import { useTicks } from '@/hooks/useTicks';
import { useMealNotes } from '@/hooks/useMealNotes';
import { useTickItem, useClearTick } from '@/hooks/useTickItem';
import { useTrackAllUntracked } from '@/hooks/useTrackAllUntracked';
import { useSetMealNote } from '@/hooks/useSetMealNote';
import { useSetLastViewedDay } from '@/hooks/useSetLastViewedDay';
import { usePickAndUploadPhoto } from '@/hooks/usePickAndUploadPhoto';
import { effectiveSnapshot, type SnapshotRecipe } from '@/lib/plans/snapshot';
import { hoursSince } from '@/lib/plans/compliance';
import { todayISO } from '@/lib/plans/cycle';
import type { Tick } from '@/lib/database.types';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { DaySelector, type DaySelectorItem } from '@/components/client/DaySelector';
import { CombinedDayCard } from '@/components/client/CombinedDayCard';
import { UpcomingPlanBanner } from '@/components/client/UpcomingPlanBanner';
import { TickSheet, useTickSheet } from '@/components/client/TickSheet';

export default function WeekScreen() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const clientId = role.kind === 'client' ? role.clientId : null;

  const profile = useClientProfile(clientId);
  const plans = useActivePlan(clientId);
  const activePlan = plans.data?.active ?? null;
  const upcoming = plans.data?.upcoming ?? null;
  const ticksQuery = useTicks(activePlan?.id ?? null);
  const notesQuery = useMealNotes(activePlan?.id ?? null);

  const tickItem = useTickItem(clientId);
  const clearTick = useClearTick(clientId);
  const trackAll = useTrackAllUntracked(clientId);
  const setMealNote = useSetMealNote();
  const setLastViewedDay = useSetLastViewedDay();
  const pickPhoto = usePickAndUploadPhoto();

  const tz = profile.data?.timezone ?? 'Europe/Athens';
  const showMacros = profile.data?.show_macros_to_client ?? true;
  const today = todayISO(tz);

  const snapshot = activePlan ? effectiveSnapshot(activePlan) : null;
  const ticks: Tick[] = ticksQuery.data ?? [];

  const dayItems: DaySelectorItem[] = useMemo(() => {
    if (!snapshot) return [];
    const tickedByDay = new Map<number, Set<string>>();
    for (const tk of ticks) {
      const s = tickedByDay.get(tk.cycle_day) ?? new Set<string>();
      s.add(tk.snapshot_recipe_id);
      tickedByDay.set(tk.cycle_day, s);
    }
    return snapshot.days.map((d) => {
      const recipeIds = d.meals.flatMap((m) => m.recipes.map((r) => r.snapshotRecipeId));
      const ticked = tickedByDay.get(d.dayNumber) ?? new Set<string>();
      return {
        cycleDay: d.dayNumber,
        fullyTracked: recipeIds.length > 0 && recipeIds.every((id) => ticked.has(id)),
      };
    });
  }, [snapshot, ticks]);

  const firstUntracked = dayItems.find((d) => !d.fullyTracked)?.cycleDay;
  const lastViewed = profile.data?.last_viewed_cycle_day ?? undefined;
  const initialDay =
    (lastViewed && dayItems.some((d) => d.cycleDay === lastViewed) ? lastViewed : undefined) ??
    firstUntracked ??
    dayItems[0]?.cycleDay ??
    1;
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const day = selectedDay ?? initialDay;

  const sheetRef = useTickSheet();

  const onSelectDay = useCallback(
    (d: number) => {
      setSelectedDay(d);
      setLastViewedDay(d).catch(() => {});
    },
    [setLastViewedDay],
  );

  // 48h edit window: the active plan is editable for the current day; older
  // days lock 48h after their last tick (or always editable if untracked).
  const dayTicks = ticks.filter((tk) => tk.cycle_day === day);
  const lastTickAt = dayTicks.reduce<string | null>(
    (acc, tk) => (acc === null || tk.eaten_at > acc ? tk.eaten_at : acc),
    null,
  );
  const editable = lastTickAt === null ? true : hoursSince(lastTickAt) < 48;

  const onPressRecipe = useCallback(
    (recipe: SnapshotRecipe, existing: Tick | null) => {
      Haptics.selectionAsync().catch(() => {});
      sheetRef.current?.present(recipe, existing);
    },
    [sheetRef],
  );

  const onTrackAll = useCallback(() => {
    if (!activePlan) return;
    Alert.alert('', t('week.trackAllConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('week.trackAll'),
        onPress: () => trackAll.mutate({ plan: activePlan, cycleDay: day, existingTicks: ticks }),
      },
    ]);
  }, [activePlan, day, ticks, trackAll, t]);

  const refreshing = plans.isRefetching || ticksQuery.isRefetching || notesQuery.isRefetching;
  const onRefresh = () => {
    plans.refetch();
    ticksQuery.refetch();
    notesQuery.refetch();
    profile.refetch();
  };

  if (plans.isLoading || profile.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <PageHeader
          title={t('nav.plan')}
          subtitle={
            snapshot
              ? `${dayItems.filter((d) => d.fullyTracked).length}/${snapshot.days.length}`
              : undefined
          }
        />

        {upcoming ? <UpcomingPlanBanner upcoming={upcoming} todayIso={today} /> : null}

        {!activePlan || !snapshot ? (
          <EmptyState title={t('week.noActivePlan')} />
        ) : (
          <>
            <DaySelector days={dayItems} selected={day} onSelect={onSelectDay} />
            {snapshot.days
              .filter((d) => d.dayNumber === day)
              .map((d) => (
                <CombinedDayCard
                  key={d.dayNumber}
                  plan={activePlan}
                  day={d}
                  totalDays={snapshot.days.length}
                  ticks={ticks}
                  mealNotes={notesQuery.data ?? []}
                  editable={editable}
                  showMacros={showMacros}
                  onPressRecipe={onPressRecipe}
                  onTrackAll={onTrackAll}
                  onSaveNote={(mealLabel, body) =>
                    setMealNote.mutateAsync({
                      planId: activePlan.id,
                      cycleDay: d.dayNumber,
                      mealLabel,
                      body,
                    })
                  }
                />
              ))}
          </>
        )}
      </ScrollView>

      <TickSheet
        sheetRef={sheetRef}
        editable={editable}
        onSubmit={async (recipe, payload) => {
          if (!activePlan) return;
          await tickItem.mutateAsync({
            planId: activePlan.id,
            cycleDay: day,
            snapshotRecipeId: recipe.snapshotRecipeId,
            status: payload.status,
            snapshotAlternativeId: payload.snapshotAlternativeId,
            ingredientsEaten: payload.ingredientsEaten,
            note: payload.note,
            photoUrl: payload.photoUrl,
          });
        }}
        onClear={async (recipe) => {
          if (!activePlan) return;
          await clearTick.mutateAsync({
            planId: activePlan.id,
            snapshotRecipeId: recipe.snapshotRecipeId,
          });
        }}
        onPickPhoto={async (recipe) => {
          if (!activePlan) return null;
          return pickPhoto({
            planId: activePlan.id,
            cycleDay: day,
            snapshotRecipeId: recipe.snapshotRecipeId,
          });
        }}
      />
    </SafeAreaView>
  );
}
