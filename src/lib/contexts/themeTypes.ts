export type Theme = 'dark' | 'light' | 'system';

export const THEME_TYPES = {
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
} satisfies Readonly<Record<string, Theme>>;
