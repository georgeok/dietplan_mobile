import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export default function AccountArchivedScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <Text className="text-2xl font-bold text-foreground">
          {t('accountArchived.title')}
        </Text>
        <Text className="text-center text-base text-muted-foreground">
          {t('accountArchived.body')}
        </Text>
        <Button onPress={onLogout} variant="outline">
          {t('settings.signOut')}
        </Button>
      </View>
    </SafeAreaView>
  );
}
