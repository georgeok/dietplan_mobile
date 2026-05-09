import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import el from './el.json';
import en from './en.json';

export const LOCALE_STORAGE_KEY = 'app.locale';

function defaultLocale(): 'el' | 'en' {
  const code = Localization.getLocales()[0]?.languageCode ?? 'el';
  return code === 'en' ? 'en' : 'el';
}

let initialized = false;

export async function initI18n() {
  if (initialized) return;
  initialized = true;
  let stored: string | null = null;
  try {
    stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {}
  const lng =
    stored === 'el' || stored === 'en' ? stored : defaultLocale();
  await i18n.use(initReactI18next).init({
    resources: { el: { translation: el }, en: { translation: en } },
    lng,
    fallbackLng: 'el',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    compatibilityJSON: 'v4',
  });
}

export async function setLocale(lng: 'el' | 'en') {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem(LOCALE_STORAGE_KEY, lng);
}

export default i18n;
