'use client';

import { createContext, type ReactElement, type ReactNode, useContext } from 'react';

const NowContext = createContext<Date | null>(null);

/**
 * The moment the page was rendered, for a server and the browser to agree on: useNow starts from it instead of the
 * clock, so time-dependent text (today, a now line) hydrates without a mismatch. Without it, useNow reads the clock.
 */
export function NowProvider({ now, children }: { now: Date; children: ReactNode }): ReactElement {
  return <NowContext value={now}>{children}</NowContext>;
}

/** The provided render time, or null. */
export const useProvidedNow = (): Date | null => useContext(NowContext);
