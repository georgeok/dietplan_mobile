import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useSetLastViewedDay() {
  return useCallback(async (cycleDay: number) => {
    await supabase.rpc('set_last_viewed_cycle_day', { p_cycle_day: cycleDay });
  }, []);
}
