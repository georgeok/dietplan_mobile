import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { CalendarRange, ScaleIcon, ShoppingCart, Settings as SettingsIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';

export default function ClientTabsLayout() {
  const { role, status } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();

  useEffect(() => {
    if (status !== 'ready') return;
    if (role.kind === 'anonymous') {
      router.replace('/(auth)/sign-in');
    } else if (role.kind === 'archived_client') {
      router.replace('/(auth)/account-archived');
    } else if (role.kind === 'dietitian') {
      router.replace({
        pathname: '/(auth)/sign-in',
        params: { error: 'clientOnlyApp' },
      });
    } else if (role.kind === 'unprovisioned') {
      router.replace({
        pathname: '/(auth)/sign-in',
        params: { error: 'noInvitation' },
      });
    }
  }, [status, role, router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.emerald700,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="week"
        options={{
          title: t('nav.plan'),
          tabBarIcon: ({ color }) => <CalendarRange color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="weight"
        options={{
          title: t('nav.weight'),
          tabBarIcon: ({ color }) => <ScaleIcon color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: t('nav.shopping'),
          tabBarIcon: ({ color }) => <ShoppingCart color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('nav.settings'),
          tabBarIcon: ({ color }) => <SettingsIcon color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
