import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';

export type DaySelectorItem = {
  cycleDay: number;
  fullyTracked: boolean;
};

export function DaySelector({
  days,
  selected,
  onSelect,
}: {
  days: DaySelectorItem[];
  selected: number;
  onSelect: (cycleDay: number) => void;
}) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const idx = days.findIndex((d) => d.cycleDay === selected);
    if (idx >= 0) {
      scrollRef.current?.scrollTo({ x: Math.max(0, idx * 64 - 100), animated: true });
    }
  }, [selected, days]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 4, paddingVertical: 8 }}
    >
      {days.map((d) => {
        const active = d.cycleDay === selected;
        return (
          <Pressable
            key={d.cycleDay}
            onPress={() => onSelect(d.cycleDay)}
            className={`h-14 w-14 items-center justify-center rounded-lg border ${
              active
                ? 'border-primary bg-primary'
                : d.fullyTracked
                  ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950'
                  : 'border-border bg-background'
            }`}
          >
            <Text
              className={`text-[9px] uppercase ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`}
            >
              DAY
            </Text>
            <Text
              className={`text-base font-bold ${active ? 'text-primary-foreground' : 'text-foreground'}`}
            >
              {d.cycleDay}
            </Text>
            {d.fullyTracked && !active ? (
              <Check size={10} color={colors.emerald700} />
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
