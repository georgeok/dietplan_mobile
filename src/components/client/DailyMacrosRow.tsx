import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DailyMacros } from '@/lib/plans/macros';

export function DailyMacrosRow({
  totals,
  planned,
}: {
  totals: DailyMacros;
  planned?: DailyMacros;
}) {
  const { t } = useTranslation();
  const items: { label: string; value: number; plan?: number }[] = [
    { label: 'kcal', value: Math.round(totals.kcal), plan: planned ? Math.round(planned.kcal) : undefined },
    { label: 'P', value: Math.round(totals.proteinG), plan: planned ? Math.round(planned.proteinG) : undefined },
    { label: 'C', value: Math.round(totals.carbsG), plan: planned ? Math.round(planned.carbsG) : undefined },
    { label: 'F', value: Math.round(totals.fatG), plan: planned ? Math.round(planned.fatG) : undefined },
  ];
  return (
    <View className="mt-2 flex-row gap-4">
      {items.map((it) => (
        <View key={it.label} className="flex-row items-baseline gap-1">
          <Text className="text-xs text-muted-foreground">{it.label}</Text>
          <Text className="text-sm font-semibold text-foreground">
            {it.value}
            {it.plan !== undefined ? (
              <Text className="text-xs text-muted-foreground">{` / ${it.plan}`}</Text>
            ) : null}
          </Text>
        </View>
      ))}
      <Text className="sr-only">{t('tick.eaten')}</Text>
    </View>
  );
}
