import { View } from 'react-native';
import {
  Coffee,
  Sandwich,
  UtensilsCrossed,
  Apple,
  Cookie,
} from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';

const ICONS = [Coffee, Sandwich, UtensilsCrossed, Apple, Cookie];
const TONES = [
  'amber700',
  'emerald700',
  'sky700',
  'rose700',
  'violet700',
] as const;

export function MealIcon({ index }: { index: number }) {
  const { colors } = useTheme();
  const Icon = ICONS[index % ICONS.length]!;
  const tone = TONES[index % TONES.length]!;
  return (
    <View className="h-9 w-9 items-center justify-center rounded-lg bg-muted">
      <Icon size={18} color={colors[tone]} strokeWidth={2} />
    </View>
  );
}
