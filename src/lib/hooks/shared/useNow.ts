import { useEffect, useState } from 'react';

/**
 * The current time, as one stable Date per interval (default a minute). Read "now" from this rather than calling a
 * zero-argument toDate() / new Date() while rendering: the React Compiler caches calls whose inputs never change, so
 * those would stay frozen at the first render. A component that shows the time (a now line, "today") re-renders when it
 * ticks.
 */
export const useNow = (intervalMs = 60_000): Date => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
};
