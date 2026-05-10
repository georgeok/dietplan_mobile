import { Pressable, Text, View } from 'react-native';
import { CalendarClock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/providers/ThemeProvider';
import { formatDate } from '@/lib/format';
import type { ClientPlan } from '@/lib/database.types';

export function UpcomingPlanBanner({
  upcoming,
  todayIso,
}: {
  upcoming: ClientPlan;
  todayIso: string;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const ready = !upcoming.start_date || upcoming.start_date <= todayIso;
  return (
    <View className="mb-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
      <View className="flex-row items-center gap-2">
        <CalendarClock size={18} color={colors.emerald700} />
        <Text className="flex-1 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
          {ready
            ? t('week.upcomingPlanReady')
            : t('week.upcomingPlanScheduled', {
                date: upcoming.start_date ? formatDate(upcoming.start_date) : '',
              })}
        </Text>
      </View>
      <Pressable
        onPress={() => router.push({ pathname: '/(client)/shopping', params: { plan: 'next' } })}
        className="mt-2 self-start"
      >
        <Text className="text-xs font-semibold text-emerald-700 underline dark:text-emerald-300">
          {t('week.viewNextPlanShopping')}
        </Text>
      </Pressable>
    </View>
  );
}
