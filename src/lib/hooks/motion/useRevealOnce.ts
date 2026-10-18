import { useEffect, useState } from 'react';

const storageKey = (key: string) => `rsk:revealed:${key}`;

const seen = (key: string) => {
  try {
    return sessionStorage.getItem(storageKey(key)) !== null;
  } catch {
    return true; // No storage (private mode, blocked): never animate rather than animate every time.
  }
};

/**
 * True on the first visit to `key` (a route) in this browser session, false afterwards — so back/forward and revisits
 * never replay a reveal. Read once when mounted (a read-only initializer, safe under StrictMode); recorded after.
 */
export function useRevealOnce(key: string) {
  const [reveal] = useState(() => !seen(key));

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey(key), '1');
    } catch {
      // Storage unavailable: nothing to record.
    }
  }, [key]);

  return reveal;
}
