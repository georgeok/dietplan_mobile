import { Text, View } from 'react-native';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/providers/ThemeProvider';
import { formatDate, formatKg } from '@/lib/format';
import type { WeightLog } from '@/lib/database.types';

export function WeightStatCard({ logs }: { logs: WeightLog[] }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  if (logs.length === 0) return null;
  const first = logs[0]!;
  const last = logs[logs.length - 1]!;
  const firstKg = Number(first.kg);
  const lastKg = Number(last.kg);
  const delta = lastKg - firstKg;
  const days = Math.max(
    0,
    Math.round((new Date(last.logged_at).getTime() - new Date(first.logged_at).getTime()) / 86_400_000),
  );
  const trend = delta <= -0.1 ? 'down' : delta >= 0.1 ? 'up' : 'stable';
  const Icon = trend === 'down' ? TrendingDown : trend === 'up' ? TrendingUp : Minus;
  const trendColor = trend === 'down' ? colors.emerald700 : trend === 'up' ? colors.rose700 : colors.mutedForeground;
  const trendLabel =
    trend === 'down' ? t('weight.trendDown') : trend === 'up' ? t('weight.trendUp') : t('weight.trendStable');

  return (
    <View className="rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-end justify-between">
        <View>
          <Text className="text-xs text-muted-foreground">{t('weight.current')}</Text>
          <Text className="text-3xl font-bold text-foreground">{formatKg(lastKg)}</Text>
        </View>
        <View className="flex-row items-center gap-1 rounded-full bg-muted px-2 py-1">
          <Icon size={14} color={trendColor} />
          <Text className="text-xs font-semibold" style={{ color: trendColor }}>
            {trendLabel} {delta > 0 ? '+' : ''}{delta.toFixed(1)}
          </Text>
        </View>
      </View>
      <Text className="mt-2 text-xs text-muted-foreground">
        {t('weight.start')}: {formatKg(firstKg)} · {formatDate(first.logged_at)} · {t('weight.daysAgo', { days })}
      </Text>
    </View>
  );
}
