import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner-native';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useClientProfile } from '@/hooks/useClientProfile';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { useExportData } from '@/hooks/useExportData';
import { useDeleteAccount, useSignOut } from '@/hooks/useDeleteAccount';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { SegmentRow } from '@/components/ui/SegmentRow';

const COMMON_TZ = [
  'Europe/Athens',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/Madrid',
  'Europe/Rome',
  'America/New_York',
  'America/Los_Angeles',
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const { mode, setMode } = useTheme();
  const clientId = role.kind === 'client' ? role.clientId : null;
  const profile = useClientProfile(clientId);
  const updateProfile = useUpdateProfile(clientId);
  const exportData = useExportData(clientId);
  const deleteAccount = useDeleteAccount();
  const signOut = useSignOut();

  const [name, setName] = useState('');
  const [locale, setLocaleState] = useState<'el' | 'en'>('el');
  const [tz, setTz] = useState('Europe/Athens');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile.data) {
      setName(profile.data.name);
      setLocaleState(profile.data.locale === 'en' ? 'en' : 'el');
      setTz(profile.data.timezone || 'Europe/Athens');
    }
  }, [profile.data]);

  const save = async () => {
    if (name.trim().length < 2) {
      toast.error(t('common.genericError'));
      return;
    }
    setBusy(true);
    try {
      await updateProfile.mutateAsync({ name: name.trim(), locale, timezone: tz });
      toast.success(t('settings.saved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.genericError'));
    } finally {
      setBusy(false);
    }
  };

  const onExport = async () => {
    try {
      await exportData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.genericError'));
    }
  };

  const onDelete = () => {
    Alert.alert(t('settings.deleteAccount'), t('settings.deleteAccountConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.deleteAccount'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAccount();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : t('common.genericError'));
          }
        },
      },
    ]);
  };

  if (profile.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <PageHeader title={t('settings.title')} />

        <Card className="gap-3">
          <Text className="text-sm font-semibold text-foreground">{t('settings.profile')}</Text>
          <View className="gap-1.5">
            <Label>{t('settings.name')}</Label>
            <Input value={name} onChangeText={setName} />
          </View>
          <View className="gap-1.5">
            <Label>{t('settings.email')}</Label>
            <Text className="text-sm text-muted-foreground">{profile.data?.email}</Text>
          </View>
          <View className="gap-1.5">
            <Label>{t('settings.language')}</Label>
            <SegmentRow
              options={[
                { value: 'el', label: 'Ελληνικά' },
                { value: 'en', label: 'English' },
              ]}
              value={locale}
              onChange={setLocaleState}
            />
          </View>
          <View className="gap-1.5">
            <Label>{t('settings.timezone')}</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {COMMON_TZ.map((z) => (
                <Button
                  key={z}
                  variant={z === tz ? 'default' : 'outline'}
                  size="sm"
                  onPress={() => setTz(z)}
                >
                  {z}
                </Button>
              ))}
            </ScrollView>
          </View>
          <Button onPress={save} loading={busy} fullWidth>
            {t('common.save')}
          </Button>
        </Card>

        <Card className="gap-3">
          <Text className="text-sm font-semibold text-foreground">{t('settings.theme')}</Text>
          <SegmentRow
            options={[
              { value: 'system', label: t('settings.themeSystem') },
              { value: 'light', label: t('settings.themeLight') },
              { value: 'dark', label: t('settings.themeDark') },
            ]}
            value={mode}
            onChange={(v) => setMode(v)}
          />
        </Card>

        <Card className="gap-3">
          <Text className="text-sm font-semibold text-foreground">{t('settings.exportData')}</Text>
          <Text className="text-xs text-muted-foreground">{t('settings.exportDescription')}</Text>
          <Button onPress={onExport} variant="outline" fullWidth>
            {t('settings.exportData')}
          </Button>
        </Card>

        <Card className="gap-3">
          <Text className="text-sm font-semibold text-destructive">{t('settings.dangerZone')}</Text>
          <Button onPress={onDelete} variant="destructive" fullWidth>
            {t('settings.deleteAccount')}
          </Button>
        </Card>

        <Button onPress={() => signOut()} variant="ghost" fullWidth>
          {t('settings.signOut')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
