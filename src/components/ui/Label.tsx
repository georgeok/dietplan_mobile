import { Text, type TextProps } from 'react-native';

export function Label({ className = '', ...rest }: TextProps & { className?: string }) {
  return <Text {...rest} className={`text-sm font-medium text-foreground ${className}`} />;
}
