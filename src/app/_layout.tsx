import 'react-native-url-polyfill/auto';
import '../../global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Toaster } from 'sonner-native';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { I18nProvider } from '@/providers/I18nProvider';
import { AuthProvider } from '@/providers/AuthProvider';

function Inner() {
  const { scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
      <Toaster position="top-center" richColors />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryProvider>
            <I18nProvider>
              <AuthProvider>
                <BottomSheetModalProvider>
                  <Inner />
                </BottomSheetModalProvider>
              </AuthProvider>
            </I18nProvider>
          </QueryProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
