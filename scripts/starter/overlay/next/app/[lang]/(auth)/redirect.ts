import type { KitLanguage } from '@contexts';

import { safeNext } from '@utils';

/** Where sign-in sends someone: ?next= when it is a page of this app in this language, else the dashboard. */
export function acceptNext(next: string | null | undefined, lang: KitLanguage): string {
  const fallback = `/${lang}/dashboard`;
  // Checked after safeNext normalises it: "/en/..//evil.com" must not pass as "/en/…".
  const path = safeNext(next, fallback);
  return path === `/${lang}` || path.startsWith(`/${lang}/`) || path.startsWith(`/${lang}?`) ? path : fallback;
}
