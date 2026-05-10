import Svg, { Path, Circle } from 'react-native-svg';
import { View } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import type { WeightLog } from '@/lib/database.types';

export function WeightChart({ logs }: { logs: WeightLog[] }) {
  const { colors } = useTheme();
  if (logs.length < 2) return null;
  const W = 320;
  const H = 120;
  const pad = 8;
  const xs = logs.map((_, i) => i);
  const ys = logs.map((l) => Number(l.kg));
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeY = maxY - minY || 1;
  const px = (i: number) => pad + (i / (xs.length - 1)) * (W - pad * 2);
  const py = (v: number) => H - pad - ((v - minY) / rangeY) * (H - pad * 2);
  const d = ys.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(v)}`).join(' ');
  const lastX = px(xs.length - 1);
  const lastY = py(ys[ys.length - 1]!);

  return (
    <View className="items-center rounded-2xl border border-border bg-card p-3">
      <Svg width={W} height={H}>
        <Path d={d} stroke={colors.emerald500} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={lastX} cy={lastY} r={4} fill={colors.emerald600} />
      </Svg>
    </View>
  );
}
