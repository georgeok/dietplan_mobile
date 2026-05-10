import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useToggleShoppingOverride(clientId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { normalized: string; have: boolean }) => {
      if (!clientId) throw new Error('no client');
      if (input.have) {
        const { error } = await supabase.from('shopping_list_overrides').upsert(
          { client_id: clientId, item_name_normalized: input.normalized },
          { onConflict: 'client_id,item_name_normalized' },
        );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('shopping_list_overrides')
          .delete()
          .eq('client_id', clientId)
          .eq('item_name_normalized', input.normalized);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shoppingOverrides', clientId] }),
  });
}
