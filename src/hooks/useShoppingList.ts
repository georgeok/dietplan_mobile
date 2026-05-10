import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { useActivePlan } from '@/hooks/useActivePlan';
import { useTicks } from '@/hooks/useTicks';
import { categorizeFoods } from '@/lib/plans/categorize';
import {
  aggregateShoppingItems,
  groupShoppingItems,
  type ShoppingGroup,
  type ShoppingItem,
} from '@/lib/plans/shopping';
import { supabase } from '@/lib/supabase';
import type { ClientPlan, FoodCategory } from '@/lib/database.types';

export function useShoppingOverrides(clientId: string | null) {
  return useQuery({
    queryKey: ['shoppingOverrides', clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<Set<string>> => {
      if (!clientId) return new Set();
      const { data, error } = await supabase
        .from('shopping_list_overrides')
        .select('item_name_normalized')
        .eq('client_id', clientId);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.item_name_normalized));
    },
  });
}

export function useFoodCategories(
  dietitianId: string | null,
  names: string[],
) {
  const key = useMemo(() => [...names].sort().join('|'), [names]);
  return useQuery({
    queryKey: ['foodCategories', dietitianId, key],
    enabled: names.length > 0,
    queryFn: () => categorizeFoods(names, dietitianId),
  });
}

export type ShoppingData = {
  plan: ClientPlan | null;
  items: ShoppingItem[];
};

/**
 * Resolves the plan to show (current/active vs. next/upcoming) and its raw
 * aggregated items. Categorization + override filtering happen in the screen
 * so they can react to mutations without re-aggregating.
 */
export function useShoppingPlan(which: 'current' | 'next') {
  const { role } = useAuth();
  const clientId = role.kind === 'client' ? role.clientId : null;
  const plans = useActivePlan(clientId);
  const active = plans.data?.active ?? null;
  const upcoming = plans.data?.upcoming ?? null;
  const plan = which === 'next' && upcoming ? upcoming : active;
  const ticks = useTicks(which === 'next' ? null : active?.id ?? null);

  const items = useMemo<ShoppingItem[]>(() => {
    if (!plan) return [];
    const relevantTicks = which === 'next' ? [] : ticks.data ?? [];
    return aggregateShoppingItems(plan, relevantTicks);
  }, [plan, ticks.data, which]);

  return {
    isLoading: plans.isLoading || (which !== 'next' && ticks.isLoading),
    active,
    upcoming,
    plan,
    items,
    refetch: () => {
      plans.refetch();
      ticks.refetch();
    },
  };
}

export { groupShoppingItems, type ShoppingGroup };
