import { Appearance, type ColorSchemeName, View } from 'react-native';
import { useEffect, useMemo, useState, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorsLight, colorsDark, type ThemeColors } from '@/lib/theme/colors';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  mode: ThemeMode;
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const MODE_KEY = 'app.themeMode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme(),
  );

  useEffect(() => {
    AsyncStorage.getItem(MODE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
    });
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(MODE_KEY, next).catch(() => {});
  };

  const scheme: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      scheme,
      colors: scheme === 'dark' ? colorsDark : colorsLight,
      setMode,
    }),
    [mode, scheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={{ flex: 1 }} className={scheme === 'dark' ? 'dark' : ''}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const v = useContext(ThemeContext);
  if (!v) throw new Error('useTheme must be used inside ThemeProvider');
  return v;
}
