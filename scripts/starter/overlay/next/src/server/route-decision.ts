// Where a request goes before any page renders (proxy.ts): the language in front of every page, and signed-out
// visitors sent to sign in. Pure, so every rule has a test.
import type { KitLanguage } from '@contexts';

import { DEFAULT_LANG, isLang, LANGS } from '@env';

/** Pages behind sign-in (and everything under them). */
export const PROTECTED = ['/dashboard', '/settings'];

const LANG_SEGMENT = new RegExp(`^/(${LANGS.join('|')})(?=/|$)`);

type Request = { pathname: string; search: string; langCookie?: string; acceptLanguage?: string; hasSession: boolean };
type Decision = { redirect?: string; lang: KitLanguage };

/** The browser's most preferred language this app has (q-values honoured; ar-JO counts as ar). */
export function preferredLanguage(acceptLanguage: string | undefined): KitLanguage | undefined {
  return (acceptLanguage ?? '')
    .split(',')
    .map((entry, order) => {
      const [tag, ...params] = entry.trim().split(';');
      const q = Number(
        params
          .find((param) => param.trim().startsWith('q='))
          ?.trim()
          .slice(2) ?? 1,
      );
      return { lang: tag.trim().toLowerCase().split('-')[0], q: Number.isNaN(q) ? 0 : q, order };
    })
    .filter((entry) => entry.q > 0)
    .sort((a, b) => b.q - a.q || a.order - b.order)
    .map((entry) => entry.lang)
    .find(isLang);
}

export function decideRoute({ pathname, search, langCookie, acceptLanguage, hasSession }: Request): Decision {
  if (pathname === '/api' || pathname.startsWith('/api/') || pathname.startsWith('/_next/')) return { lang: DEFAULT_LANG };

  const match = LANG_SEGMENT.exec(pathname);
  if (!match) {
    // A file at the root (favicon, manifest): served as it is.
    if (/\.\w+$/.test(pathname)) return { lang: DEFAULT_LANG };
    const lang = isLang(langCookie) ? langCookie : (preferredLanguage(acceptLanguage) ?? DEFAULT_LANG);
    return { lang, redirect: `/${lang}${pathname === '/' ? '' : pathname}${search}` };
  }

  const lang = match[1] as KitLanguage;
  const page = pathname.slice(match[0].length) || '/';
  if (!hasSession && PROTECTED.some((path) => page === path || page.startsWith(`${path}/`)))
    return { lang, redirect: `/${lang}/login?next=${encodeURIComponent(`${pathname}${search}`)}` };
  if (hasSession && page === '/login') return { lang, redirect: `/${lang}/dashboard` };
  return { lang };
}
