import Svg, { Circle } from 'react-native-svg';
import { Text, View } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

export function ComplianceRing({ percent, size = 56 }: { percent: number; size?: number }) {
  const { colors } = useTheme();
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c * (1 - clamped / 100);
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.border}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.emerald500}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View className="absolute items-center justify-center">
        <Text className="text-xs font-bold text-foreground">{clamped}%</Text>
      </View>
    </View>
  );
}
