'use client';

import { useEffect, useState } from 'react';

import { useProvidedNow } from '../../contexts/NowContext';

/**
 * The current time, as one stable Date per interval (default a minute). Read "now" from this rather than calling a
 * zero-argument toDate() / new Date() while rendering: the React Compiler caches calls whose inputs never change, so
 * those would stay frozen at the first render. A component that shows the time (a now line, "today") re-renders when it
 * ticks. Under a NowProvider it starts from the provided time (a server-rendered page's), then ticks from the clock.
 */
export const useNow = (intervalMs = 60_000): Date => {
  const provided = useProvidedNow();
  const [now, setNow] = useState(() => provided ?? new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
};
