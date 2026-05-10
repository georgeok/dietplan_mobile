import { Pressable, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { formatItemDetail, type ShoppingItem } from '@/lib/plans/shopping';

export function ShoppingRow({
  item,
  have,
  onToggle,
}: {
  item: ShoppingItem;
  have: boolean;
  onToggle: (have: boolean) => void;
}) {
  const { colors } = useTheme();
  const detail = formatItemDetail(item);
  return (
    <Pressable
      onPress={() => onToggle(!have)}
      className="flex-row items-center gap-3 border-b border-border bg-card px-4 py-3"
    >
      <View
        className={`h-5 w-5 items-center justify-center rounded border ${
          have ? 'border-emerald-500 bg-emerald-500' : 'border-border'
        }`}
      >
        {have ? <Check size={14} color="#fff" /> : null}
      </View>
      <Text
        className={`flex-1 text-sm ${have ? 'text-muted-foreground line-through' : 'text-foreground'}`}
      >
        {item.name}
      </Text>
      {detail ? <Text className="text-xs text-muted-foreground">{detail}</Text> : null}
    </Pressable>
  );
}
