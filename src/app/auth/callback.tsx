import { useEffect, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { getCurrentRole } from '@/lib/auth/role';
import { useAuth } from '@/providers/AuthProvider';

type OtpType = 'magiclink' | 'signup' | 'invite' | 'recovery' | 'email_change' | 'email';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { refresh } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    (async () => {
      const url = await Linking.getInitialURL();
      const params = url ? Linking.parse(url).queryParams ?? {} : {};
      const code = stringParam(params.code);
      const tokenHash = stringParam(params.token_hash);
      const type = stringParam(params.type) as OtpType | null;
      const errorDescription = stringParam(params.error_description);

      if (errorDescription) {
        router.replace({ pathname: '/(auth)/sign-in', params: { error: 'linkExpired' } });
        return;
      }

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });
          if (error) throw error;
        } else {
          // No payload — go back to sign-in.
          router.replace('/(auth)/sign-in');
          return;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'generic';
        const errKind = /expired|already/i.test(msg) ? 'linkExpired' : 'generic';
        router.replace({ pathname: '/(auth)/sign-in', params: { error: errKind } });
        return;
      }

      // Bind invitation if needed (idempotent).
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email;
      if (email) {
        await supabase.rpc('bind_invited_client', { p_email: email });
      }
      await refresh();
      const role = await getCurrentRole();
      if (role.kind === 'client') {
        router.replace('/(client)/week');
      } else if (role.kind === 'archived_client') {
        router.replace('/(auth)/account-archived');
      } else if (role.kind === 'dietitian') {
        router.replace({
          pathname: '/(auth)/sign-in',
          params: { error: 'clientOnlyApp' },
        });
      } else {
        router.replace({
          pathname: '/(auth)/sign-in',
          params: { error: 'noInvitation' },
        });
      }
    })();
  }, [refresh, router]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator />
      <Text className="mt-3 text-sm text-muted-foreground">…</Text>
    </View>
  );
}

function stringParam(v: unknown): string | null {
  if (typeof v === 'string' && v.length > 0) return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return null;
}
