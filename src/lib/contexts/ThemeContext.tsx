import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { useStorage } from '@hooks/shared';

type Theme = 'dark' | 'light' | 'system';

type ThemeProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export const THEME_TYPES = {
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
} satisfies Readonly<Record<string, Theme>>;

const initialState: ThemeState = {
  theme: THEME_TYPES.DARK,
  setTheme: () => null,
};

const DEFAULT_STORAGE_KEY = 'vite-ui-theme';

export function ThemeProvider({ children, defaultTheme = THEME_TYPES.DARK, storageKey = DEFAULT_STORAGE_KEY, ...props }: ThemeProps) {
  const [storageTheme, setStorageTheme] = useStorage<Theme, Theme>(storageKey, defaultTheme);

  const [theme, setTheme] = useState<Theme>(storageTheme);

  const onSetTheme = useCallback(
    (theme: Theme) => {
      setStorageTheme(theme);

      setTheme(theme);
    },
    [setStorageTheme],
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove(THEME_TYPES.LIGHT, THEME_TYPES.DARK);

    if (theme === THEME_TYPES.SYSTEM) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? THEME_TYPES.DARK : THEME_TYPES.LIGHT;

      root.classList.add(systemTheme);

      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const contextValue = {
    theme,
    setTheme: onSetTheme,
  };

  return (
    <ThemeContext.Provider {...props} value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

const ThemeContext = createContext<ThemeState>(initialState);

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
