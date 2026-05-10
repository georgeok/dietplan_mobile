import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TickStatus } from '@/lib/database.types';

export type DisplayStatus = TickStatus | 'pending';

const STYLES: Record<DisplayStatus, { box: string; text: string }> = {
  eaten: {
    box: 'bg-emerald-100 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  partial: {
    box: 'bg-amber-100 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
  },
  skipped: {
    box: 'bg-rose-100 border-rose-200 dark:bg-rose-950 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-300',
  },
  pending: {
    box: 'bg-muted border-border',
    text: 'text-muted-foreground',
  },
};

export function StatusPill({ status }: { status: DisplayStatus }) {
  const { t } = useTranslation();
  const s = STYLES[status];
  return (
    <View className={`rounded-full border px-2 py-0.5 ${s.box}`}>
      <Text className={`text-[10px] font-semibold ${s.text}`}>{t(`tick.${status}`)}</Text>
    </View>
  );
}
