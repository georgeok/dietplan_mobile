import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { toast } from 'sonner-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { authCallbackURL } from '@/lib/deeplink';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';

export function SignInForm({ initialError }: { initialError?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSendMagicLink = async () => {
    if (!email.includes('@')) {
      toast.error(t('auth.errors.generic'));
      return;
    }
    setSending(true);
    const redirectTo = authCallbackURL();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success(t('auth.magicLinkSent'));
  };

  // Supabase only redirects back to `redirectTo` if that exact URL is in the
  // project's Auth → Redirect URLs allowlist; otherwise it silently falls back
  // to the Site URL and the in-app browser parks there instead of closing. In
  // Expo Go `redirectTo` embeds the LAN IP, which changes between networks, so
  // surface the value the dev needs to whitelist when the round-trip fails.
  const reportOAuthFailure = (redirectTo: string) => {
    toast.error(t('auth.errors.oauthNotCompleted'));
    if (__DEV__) {
      Alert.alert(
        'Google sign-in did not redirect back',
        `Add this exact URL to Supabase → Authentication → URL Configuration → Redirect URLs (the IP changes when you switch networks):\n\n${redirectTo}`,
      );
    }
  };

  const onGoogle = async () => {
    setOauthLoading(true);
    const redirectTo = authCallbackURL();
    if (__DEV__) console.log('[auth] OAuth redirectTo =', redirectTo);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data?.url) {
      setOauthLoading(false);
      toast.error(error?.message ?? t('auth.errors.generic'));
      return;
    }
    // openAuthSessionAsync intercepts the redirect and hands us the final URL;
    // the in-app browser closes itself but no OS deep-link event fires, so we
    // forward result.url to /auth/callback to finish the code exchange.
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    setOauthLoading(false);
    if (result.type !== 'success') {
      reportOAuthFailure(redirectTo);
      return;
    }
    const params = Linking.parse(result.url).queryParams ?? {};
    if (!params.code && !params.token_hash && !params.error_description) {
      reportOAuthFailure(redirectTo);
      return;
    }
    router.replace({ pathname: '/auth/callback', params: { url: result.url } });
  };

  return (
    <View className="gap-4">
      {initialError ? (
        <View className="rounded-lg border border-destructive bg-destructive/10 p-3">
          <Text className="text-sm text-destructive">
            {t(`auth.errors.${initialError}`, { defaultValue: t('auth.errors.generic') })}
          </Text>
        </View>
      ) : null}

      <Button onPress={onGoogle} variant="outline" loading={oauthLoading} fullWidth>
        {t('auth.continueWithGoogle')}
      </Button>

      <View className="flex-row items-center gap-2">
        <View className="h-px flex-1 bg-border" />
        <Text className="text-xs uppercase text-muted-foreground">
          {t('auth.orWithEmail')}
        </Text>
        <View className="h-px flex-1 bg-border" />
      </View>

      <View className="gap-2">
        <Label>{t('auth.email')}</Label>
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          inputMode="email"
        />
        <Text className="text-xs text-muted-foreground">{t('auth.magicLinkHelp')}</Text>
      </View>

      <Button onPress={onSendMagicLink} loading={sending} fullWidth>
        {sent ? t('auth.magicLinkSent') : t('auth.sendMagicLink')}
      </Button>

      <Text className="text-center text-xs text-muted-foreground">
        {t('auth.clientHint')}
      </Text>
    </View>
  );
}
