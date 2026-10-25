// The language lives in the URL's first segment (/en/…, /ar/…). Kit code and src/routes stay language-free; these put
// the language on and take it off at the edges.
import type { KitLanguage } from '@contexts';

import { LANGS } from '@env';

/** The visitor's chosen language, read by proxy.ts on their next visit to "/". */
export const LANG_COOKIE = 'rsk-lang';

const LANG_PREFIX = new RegExp(`^/(${LANGS.join('|')})(?=$|[/?#])`);

/** `pathname` without its language: /ar/patients/7 → /patients/7, /en → /. */
export const stripLang = (pathname: string): string => pathname.replace(LANG_PREFIX, '') || '/';

/** An app path under `lang` (replacing any language it had). Anything else — #hash, ?query, other origins — as it is. */
export function withLang(lang: KitLanguage, href: string): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const path = stripLang(href);
  if (path === '/') return `/${lang}`;
  return /^\/[?#]/.test(path) ? `/${lang}${path.slice(1)}` : `/${lang}${path}`;
}

/** The same page in another language, query kept. */
export const swapLang = (pathname: string, search: string, lang: KitLanguage): string => `${withLang(lang, pathname)}${search}`;

/**
 * The route pattern from the matched layout segments: route groups dropped, a segment equal to a param's value
 * replaced by `:name` (a catch-all's joined value too), so every patient's page reads as /patients/:id.
 */
export function patternOf(segments: string[], params: Record<string, string | string[] | undefined>): string {
  const values = Object.entries(params).filter(([name]) => name !== 'lang');
  const parts = segments
    .filter((segment) => !/^\(.*\)$/.test(segment) && !segment.startsWith('__PAGE__'))
    .map((segment) => {
      const match = values.find(([, value]) => (Array.isArray(value) ? value.join('/') : value) === segment);
      return match ? `:${match[0]}` : segment;
    });
  return `/${parts.join('/')}`;
}
