import { useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/providers/ThemeProvider';
import { formatDate, formatKg } from '@/lib/format';
import type { WeightLog } from '@/lib/database.types';

export function WeightHistoryRow({
  log,
  onDelete,
}: {
  log: WeightLog;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const ref = useRef<Swipeable>(null);

  const renderRight = () => (
    <Pressable
      onPress={() => {
        ref.current?.close();
        onDelete(log.id);
      }}
      className="w-20 items-center justify-center bg-destructive"
    >
      <Trash2 size={18} color="#fff" />
    </Pressable>
  );

  return (
    <Swipeable ref={ref} renderRightActions={renderRight} overshootRight={false}>
      <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-3">
        <Text className="text-sm font-medium text-foreground">{formatKg(Number(log.kg))}</Text>
        <Text className="text-xs text-muted-foreground">{formatDate(log.logged_at)}</Text>
      </View>
    </Swipeable>
  );
}
