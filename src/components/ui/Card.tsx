import { View, type ViewProps } from 'react-native';

export function Card({ className = '', ...rest }: ViewProps & { className?: string }) {
  return (
    <View
      {...rest}
      className={`rounded-2xl border border-border bg-card p-4 ${className}`}
    />
  );
}
