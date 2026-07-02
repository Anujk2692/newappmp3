import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {applyTheme, COLORS, GRADIENTS} from '../config';
import {AppTheme, DEFAULT_THEME_ID, THEMES, ThemeId} from '../theme/themes';

const STORAGE_KEY = '@mediaface/theme';

interface ThemeContextValue {
  theme: AppTheme;
  themeId: ThemeId;
  colors: typeof COLORS;
  gradients: typeof GRADIENTS;
  setThemeId: (id: ThemeId) => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({children}: {children: React.ReactNode}) {
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        if (stored && stored in THEMES) {
          applyTheme(THEMES[stored as ThemeId]);
          setThemeIdState(stored as ThemeId);
        } else {
          applyTheme(THEMES[DEFAULT_THEME_ID]);
        }
      })
      .catch(() => applyTheme(THEMES[DEFAULT_THEME_ID]))
      .finally(() => setReady(true));
  }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    applyTheme(THEMES[id]);
    setThemeIdState(id);
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      theme: THEMES[themeId],
      themeId,
      colors: COLORS,
      gradients: GRADIENTS,
      setThemeId,
      ready,
    }),
    [themeId, ready, setThemeId],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
