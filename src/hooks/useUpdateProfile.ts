import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { setLocale } from '@/i18n';

export function useUpdateProfile(clientId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; locale: 'el' | 'en'; timezone: string }) => {
      if (!clientId) throw new Error('no client');
      const { error } = await supabase
        .from('clients')
        .update({ name: input.name, locale: input.locale, timezone: input.timezone })
        .eq('id', clientId);
      if (error) throw error;
      await setLocale(input.locale);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientProfile', clientId] });
    },
  });
}
