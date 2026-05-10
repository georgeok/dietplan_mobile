import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Database } from '@/lib/database.types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    '[supabase] missing env vars. Copy .env.example to .env and set EXPO_PUBLIC_SUPABASE_* values.',
  );
}

// expo-secure-store rejects values >2KB. Supabase JWT bundles can exceed that
// after refresh; fall back to AsyncStorage for the auth token specifically.
const SecureStorageAdapter = {
  getItem: (key: string) =>
    Platform.OS === 'web'
      ? AsyncStorage.getItem(key)
      : SecureStore.getItemAsync(key).catch(() => AsyncStorage.getItem(key)),
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web' || value.length > 2000) {
      return AsyncStorage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, value).catch(() =>
      AsyncStorage.setItem(key, value),
    );
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
    return Promise.allSettled([
      SecureStore.deleteItemAsync(key),
      AsyncStorage.removeItem(key),
    ]).then(() => undefined);
  },
};

export const supabase = createClient<Database, 'dp'>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: SecureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Mobile deep-link OAuth: the provider redirects back with `?code=...`,
    // which we hand to supabase.auth.exchangeCodeForSession().
    flowType: 'pkce',
  },
  db: { schema: 'dp' },
});
