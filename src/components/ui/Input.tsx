import { TextInput, type TextInputProps } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';

export function Input(props: TextInputProps) {
  const { colors, scheme } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.mutedForeground}
      className="h-11 rounded-lg border border-border bg-background px-3 text-foreground"
      style={{ color: scheme === 'dark' ? colors.foreground : colors.foreground }}
      {...props}
    />
  );
}
