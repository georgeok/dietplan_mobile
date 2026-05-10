import { useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase } from '@/lib/supabase';

export function useExportData(clientId: string | null) {
  return useCallback(async () => {
    if (!clientId) throw new Error('no client');
    const [client, plans, weight] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).maybeSingle(),
      supabase.from('client_plans').select('*').eq('client_id', clientId),
      supabase.from('weight_logs').select('*').eq('client_id', clientId),
    ]);
    const planIds = (plans.data ?? []).map((p) => p.id);
    const [ticks, notes, overrides] = await Promise.all([
      planIds.length
        ? supabase.from('ticks').select('*').in('client_plan_id', planIds)
        : Promise.resolve({ data: [] as unknown[] }),
      planIds.length
        ? supabase.from('meal_notes').select('*').in('client_plan_id', planIds)
        : Promise.resolve({ data: [] as unknown[] }),
      supabase.from('shopping_list_overrides').select('*').eq('client_id', clientId),
    ]);
    const payload = {
      exportedAt: new Date().toISOString(),
      client: client.data,
      client_plans: plans.data ?? [],
      ticks: ticks.data ?? [],
      weight_logs: weight.data ?? [],
      meal_notes: notes.data ?? [],
      shopping_list_overrides: overrides.data ?? [],
    };
    const uri = `${FileSystem.cacheDirectory}dietplan-export.json`;
    await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload, null, 2));
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/json' });
    }
  }, [clientId]);
}
