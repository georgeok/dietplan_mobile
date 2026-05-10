import { Pressable, Text, View } from 'react-native';

export function SegmentRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            className={`flex-1 rounded-lg border px-3 py-2 ${
              active ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950' : 'border-border bg-background'
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                active ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground'
              }`}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
