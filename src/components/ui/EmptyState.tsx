import { Text, View } from 'react-native';
import type { ReactNode } from 'react';

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <View className="items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card px-6 py-10">
      <Text className="text-base font-semibold text-foreground">{title}</Text>
      {body ? (
        <Text className="text-center text-sm text-muted-foreground">{body}</Text>
      ) : null}
      {action}
    </View>
  );
}
