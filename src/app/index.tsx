import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';

export default function Boot() {
  const { status, role } = useAuth();

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (role.kind === 'client') return <Redirect href="/(client)/week" />;
  if (role.kind === 'archived_client')
    return <Redirect href="/(auth)/account-archived" />;
  if (role.kind === 'dietitian')
    return <Redirect href="/(auth)/sign-in?error=client_only_app" />;
  return <Redirect href="/(auth)/sign-in" />;
}
