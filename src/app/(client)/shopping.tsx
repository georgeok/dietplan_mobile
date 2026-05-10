import { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { Share2 } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import {
  useShoppingPlan,
  useShoppingOverrides,
  useFoodCategories,
  groupShoppingItems,
} from '@/hooks/useShoppingList';
import { useToggleShoppingOverride } from '@/hooks/useToggleShoppingOverride';
import { formatItemDetail } from '@/lib/plans/shopping';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShoppingPanel } from '@/components/client/ShoppingPanel';

export default function ShoppingScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { role } = useAuth();
  const clientId = role.kind === 'client' ? role.clientId : null;
  const params = useLocalSearchParams<{ plan?: string }>();

  const [which, setWhich] = useState<'current' | 'next'>(
    params.plan === 'next' ? 'next' : 'current',
  );
  const sp = useShoppingPlan(which);
  const overrides = useShoppingOverrides(clientId);
  const toggle = useToggleShoppingOverride(clientId);

  const names = useMemo(() => sp.items.map((i) => i.name), [sp.items]);
  const dietitianId = sp.plan ? (role.kind === 'client' ? role.dietitianId : null) : null;
  const cats = useFoodCategories(dietitianId, names);

  const haveSet = overrides.data ?? new Set<string>();
  const visible = sp.items.filter((i) => !haveSet.has(i.normalized));
  const haveAlready = sp.items.filter((i) => haveSet.has(i.normalized));
  const groups = groupShoppingItems(visible, cats.data ?? new Map());

  const onShare = async () => {
    const lines: string[] = [t('shopping.title')];
    for (const g of groups) {
      lines.push('', `— ${t(`shopping.categories.${g.category}`)} —`);
      for (const it of g.items) {
        const d = formatItemDetail(it);
        lines.push(`☐ ${it.name}${d ? ` (${d})` : ''}`);
      }
    }
    await Share.share({ message: lines.join('\n') });
  };

  const showTabs = !!sp.active && !!sp.upcoming;

  if (sp.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              sp.refetch();
              overrides.refetch();
            }}
          />
        }
      >
        <View className="flex-row items-center justify-between">
          <PageHeader title={t('shopping.title')} />
          <Pressable onPress={onShare} className="flex-row items-center gap-1.5 rounded-lg border border-border px-3 py-2">
            <Share2 size={16} color={colors.foreground} />
            <Text className="text-sm text-foreground">{t('common.share')}</Text>
          </Pressable>
        </View>

        {showTabs ? (
          <SegmentedControl
            values={[t('shopping.current'), t('shopping.next')]}
            selectedIndex={which === 'next' ? 1 : 0}
            onChange={(e) =>
              setWhich(e.nativeEvent.selectedSegmentIndex === 1 ? 'next' : 'current')
            }
          />
        ) : null}

        {!sp.plan ? (
          <EmptyState title={t('week.noActivePlan')} />
        ) : groups.length === 0 && haveAlready.length === 0 ? (
          <EmptyState title={t('shopping.empty')} />
        ) : (
          <ShoppingPanel
            groups={groups}
            haveAlready={haveAlready}
            haveSet={haveSet}
            onToggle={(normalized, have) => toggle.mutate({ normalized, have })}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
