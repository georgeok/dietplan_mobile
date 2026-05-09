import * as Linking from 'expo-linking';

export function authCallbackURL(): string {
  // In Expo Go this resolves to exp://<host>:8081/--/auth/callback;
  // in production builds it resolves to dietplan://auth/callback.
  return Linking.createURL('auth/callback');
}

export function parseAuthParams(url: string | null) {
  if (!url) return null;
  const parsed = Linking.parse(url);
  return parsed.queryParams ?? null;
}
