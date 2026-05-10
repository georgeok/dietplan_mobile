import { Pressable, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useTranslation } from 'react-i18next';

export function TrackAllButton({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      className={`flex-row items-center gap-1.5 self-start rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 dark:border-emerald-800 dark:bg-emerald-950 ${
        disabled ? 'opacity-50' : ''
      }`}
    >
      <Check size={14} color={colors.emerald700} />
      <Text className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        {t('week.trackAll')}
      </Text>
    </Pressable>
  );
}
