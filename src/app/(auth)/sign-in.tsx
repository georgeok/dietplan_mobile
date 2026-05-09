import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';
import { SignInForm } from '@/components/auth/SignInForm';

export default function SignInScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ error?: string }>();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-foreground">{t('app.name')}</Text>
          <Text className="mt-2 text-base text-foreground">{t('auth.signInHeading')}</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            {t('auth.signInTagline')}
          </Text>
        </View>
        <SignInForm initialError={params.error} />
      </ScrollView>
    </SafeAreaView>
  );
}
