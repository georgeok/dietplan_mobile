import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export function useDeleteAccount() {
  const router = useRouter();
  return useCallback(async () => {
    const { error } = await supabase.rpc('delete_my_client_account');
    if (error) throw error;
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-in');
  }, [router]);
}

export function useSignOut() {
  const router = useRouter();
  return useCallback(async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-in');
  }, [router]);
}
