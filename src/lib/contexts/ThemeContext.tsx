'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { useIsHydrated } from '@hooks/shared';

import { getPersistentData, persistData } from '@utils';

import { THEME_TYPES, type Theme } from './themeTypes';

type ThemeProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeState = {
  theme: THEME_TYPES.DARK,
  setTheme: () => null,
};

const DEFAULT_STORAGE_KEY = 'rsk-theme';
/** Where the theme was kept before the key became framework-neutral: still read, so nobody loses their choice. */
const LEGACY_STORAGE_KEY = 'vite-ui-theme';

const readTheme = (key: string): Theme | null =>
  getPersistentData<Theme>(key) ?? (key === DEFAULT_STORAGE_KEY ? getPersistentData<Theme>(LEGACY_STORAGE_KEY) : null);

/** Puts the theme's class on <html> ('system' resolves to the OS setting). */
function applyTheme(theme: Theme) {
  const root = window.document.documentElement;
  const resolved =
    theme === THEME_TYPES.SYSTEM
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? THEME_TYPES.DARK
        : THEME_TYPES.LIGHT
      : theme;
  root.classList.remove(THEME_TYPES.LIGHT, THEME_TYPES.DARK);
  root.classList.add(resolved);
}

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => unknown };

/** A press this recent is what triggered the switch, so the reveal starts there. */
const PRESS_WINDOW_MS = 1000;

/** Where the reveal starts: the press that triggered it, else the focused control (keyboard), else the top inline-end corner. */
function revealOrigin(press: { x: number; y: number; at: number } | null): { x: number; y: number } {
  if (press && performance.now() - press.at < PRESS_WINDOW_MS) return press;
  const active = document.activeElement;
  if (active && active !== document.body) {
    const rect = active.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }
  return { x: document.documentElement.dir === 'rtl' ? 0 : window.innerWidth, y: 0 };
}

export function ThemeProvider({ children, defaultTheme = THEME_TYPES.DARK, storageKey = DEFAULT_STORAGE_KEY, ...props }: ThemeProps) {
  const hydrated = useIsHydrated();
  // Until the person switches: the stored theme once storage is readable (from the first render under createRoot).
  const [chosen, setChosen] = useState<Theme | null>(null);
  const theme = chosen ?? (hydrated ? (readTheme(storageKey) ?? defaultTheme) : defaultTheme);

  const lastPress = useRef<{ x: number; y: number; at: number } | null>(null);
  const switches = useRef(0);
  useEffect(() => {
    const remember = (event: PointerEvent) => {
      lastPress.current = { x: event.clientX, y: event.clientY, at: performance.now() };
    };
    window.addEventListener('pointerdown', remember, { capture: true, passive: true });
    return () => window.removeEventListener('pointerdown', remember, { capture: true });
  }, []);

  const onSetTheme = useCallback(
    (newTheme: Theme) => {
      const root = window.document.documentElement;
      const commit = () => {
        persistData(storageKey, newTheme);
        setChosen(newTheme);
      };
      const start = (document as ViewTransitionDocument).startViewTransition;
      const reduced = root.dataset.motion === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      // No View Transitions API, or reduced motion: switch at once.
      if (typeof start !== 'function' || reduced) {
        commit();
        return;
      }

      // The browser snapshots the page, the theme swaps in one go, and the new theme spreads from where it was asked
      // for (motion.css), so nothing is half old theme, half new. Never on load: only a switch gets here.
      const { x, y } = revealOrigin(lastPress.current);
      const radius = Math.ceil(Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)));
      root.style.setProperty('--theme-reveal-x', `${x}px`);
      root.style.setProperty('--theme-reveal-y', `${y}px`);
      root.style.setProperty('--theme-reveal-r', `${radius}px`);
      const switchId = (switches.current += 1);
      const transition = start.call(document, () => {
        // Freeze elements' own colour transitions first (motion.css): the new snapshot is live, so a border or button
        // easing its colour would still fade inside the circle. Before the commit, as layout effects may read layout.
        root.classList.add('theme-switching');
        // The new theme must be in the DOM before the callback returns, when the browser takes the new snapshot.
        flushSync(commit);
        applyTheme(newTheme);
      }) as { finished?: Promise<unknown> } | undefined;
      // Thaw once the reveal is over; a newer switch owns the class from then on.
      void Promise.resolve(transition?.finished)
        .catch(() => undefined)
        .then(() => {
          if (switches.current === switchId) root.classList.remove('theme-switching');
        });
    },
    [storageKey],
  );

  // A theme saved under the old key moves to the new one.
  useEffect(() => {
    if (storageKey !== DEFAULT_STORAGE_KEY || getPersistentData(storageKey) !== null) return;
    const legacy = getPersistentData<Theme>(LEGACY_STORAGE_KEY);
    if (legacy) persistData(storageKey, legacy);
  }, [storageKey]);

  useEffect(() => {
    applyTheme(theme);
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
