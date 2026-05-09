import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import type { ReactNode } from 'react';

type Variant = 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
type Size = 'sm' | 'default' | 'lg';

const VARIANT: Record<Variant, string> = {
  default: 'bg-primary',
  outline: 'border border-border bg-background',
  ghost: 'bg-transparent',
  destructive: 'bg-destructive',
  secondary: 'bg-secondary',
};

const TEXT_VARIANT: Record<Variant, string> = {
  default: 'text-primary-foreground',
  outline: 'text-foreground',
  ghost: 'text-foreground',
  destructive: 'text-white',
  secondary: 'text-secondary-foreground',
};

const SIZE: Record<Size, string> = {
  sm: 'h-9 px-3',
  default: 'h-11 px-4',
  lg: 'h-12 px-5',
};

export function Button({
  onPress,
  children,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  fullWidth = false,
}: {
  onPress?: () => void;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      className={`flex-row items-center justify-center rounded-lg ${VARIANT[variant]} ${SIZE[size]} ${
        fullWidth ? 'w-full' : ''
      } ${isDisabled ? 'opacity-60' : ''}`}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <View className="flex-row items-center gap-2">
          {typeof children === 'string' ? (
            <Text className={`text-sm font-semibold ${TEXT_VARIANT[variant]}`}>
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      )}
    </Pressable>
  );
}
