import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { authCallbackURL } from '@/lib/deeplink';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';

export function SignInForm({ initialError }: { initialError?: string }) {
  const { t } = useTranslation();
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

  const onGoogle = async () => {
    setOauthLoading(true);
    const redirectTo = authCallbackURL();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data?.url) {
      setOauthLoading(false);
      toast.error(error?.message ?? t('auth.errors.generic'));
      return;
    }
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    setOauthLoading(false);
    if (result.type !== 'success') return;
    // Deep-link will route to /auth/callback which finishes the exchange.
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
