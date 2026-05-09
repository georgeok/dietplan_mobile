import { Text, View } from 'react-native';

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-3">
      <Text className="text-2xl font-bold text-foreground">{title}</Text>
      {subtitle ? (
        <Text className="mt-1 text-sm text-muted-foreground">{subtitle}</Text>
      ) : null}
    </View>
  );
}
