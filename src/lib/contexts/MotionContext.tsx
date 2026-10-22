'use client';

import { createContext, type ReactNode, useContext, useEffect, useSyncExternalStore } from 'react';

import { useAppTranslation } from '@hooks/shared';
import { MOTION } from '@constants';

export type MotionMode = 'expressive' | 'calm' | 'reduced';
export type MotionPreference = Exclude<MotionMode, 'reduced'>;

type MotionState = { mode: MotionMode; direction: 'ltr' | 'rtl'; tokens: typeof MOTION };

const MotionContext = createContext<MotionState | null>(null);

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

const subscribe = (onChange: () => void) => {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const media = window.matchMedia(REDUCED_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};

/** The OS reduced-motion setting, live. */
export const usePrefersReducedMotion = () =>
  useSyncExternalStore(
    subscribe,
    () => typeof window !== 'undefined' && !!window.matchMedia?.(REDUCED_QUERY).matches,
    () => false,
  );

/** Resolves the app's motion mode (the OS reduced-motion setting always wins) and mirrors it to <html data-motion>. */
export function MotionProvider({ children, mode: preferred = 'expressive' }: { children: ReactNode; mode?: MotionPreference }) {
  const reduced = usePrefersReducedMotion();
  const { direction } = useAppTranslation();
  const mode: MotionMode = reduced ? 'reduced' : preferred;

  useEffect(() => {
    document.documentElement.dataset.motion = mode;
  }, [mode]);

  return <MotionContext.Provider value={{ mode, direction, tokens: MOTION }}>{children}</MotionContext.Provider>;
}

/** The motion mode. Without a MotionProvider (isolated renders, apps that skip it) the OS reduced-motion setting still wins. */
export const useMotion = (): MotionState => {
  const context = useContext(MotionContext);
  const reduced = usePrefersReducedMotion();
  const { direction } = useAppTranslation();
  return context ?? { mode: reduced ? 'reduced' : 'expressive', direction, tokens: MOTION };
};
