'use client';

import { useSyncExternalStore } from 'react';

const subscribe = (): (() => void) => () => {};

/**
 * False on the server and while hydrating, true after. Under createRoot (a Vite app) it is true from the first render,
 * so state read from storage behind it changes nothing there, and never mismatches a server's HTML in a Next app.
 */
export const useIsHydrated = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
