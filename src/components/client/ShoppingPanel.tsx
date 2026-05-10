import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FoodCategory } from '@/lib/database.types';
import type { ShoppingGroup, ShoppingItem } from '@/lib/plans/shopping';
import { ShoppingRow } from './ShoppingRow';

const DOT_COLOR: Record<FoodCategory, string> = {
  produce: '#10B981',
  dairy: '#0EA5E9',
  grains: '#B45309',
  protein: '#F43F5E',
  other: '#717171',
};

export function ShoppingPanel({
  groups,
  haveAlready,
  haveSet,
  onToggle,
}: {
  groups: ShoppingGroup[];
  haveAlready: ShoppingItem[];
  haveSet: Set<string>;
  onToggle: (normalized: string, have: boolean) => void;
}) {
  const { t } = useTranslation();
  const [showHave, setShowHave] = useState(false);

  return (
    <View className="gap-3">
      {groups.map((g) => (
        <View key={g.category} className="overflow-hidden rounded-2xl border border-border bg-card">
          <View className="flex-row items-center gap-2 bg-muted px-4 py-2">
            <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DOT_COLOR[g.category] }} />
            <Text className="flex-1 text-sm font-semibold text-foreground">
              {t(`shopping.categories.${g.category}`)}
            </Text>
            <Text className="text-xs text-muted-foreground">{g.items.length}</Text>
          </View>
          {g.items.map((item) => (
            <ShoppingRow
              key={item.normalized + (item.unit ?? '')}
              item={item}
              have={haveSet.has(item.normalized)}
              onToggle={(have) => onToggle(item.normalized, have)}
            />
          ))}
        </View>
      ))}

      {haveAlready.length > 0 ? (
        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          <Pressable onPress={() => setShowHave((v) => !v)} className="bg-muted px-4 py-2">
            <Text className="text-sm font-semibold text-muted-foreground">
              {t('shopping.alreadyHaveSection', { count: haveAlready.length })}
            </Text>
          </Pressable>
          {showHave
            ? haveAlready.map((item) => (
                <ShoppingRow
                  key={item.normalized + (item.unit ?? '')}
                  item={item}
                  have
                  onToggle={(have) => onToggle(item.normalized, have)}
                />
              ))
            : null}
        </View>
      ) : null}
    </View>
  );
}
