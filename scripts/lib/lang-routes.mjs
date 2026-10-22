// scripts/lib/lang-routes.mjs — routes with the language in the path (a Next app's /en/…, /ar/…), for the audit and
// the first-load budget. A Vite app keeps the language in storage: its routes stay as they are.
export const LANGS = ['en', 'ar'];

/** `route` under `lang`: /dashboard → /ar/dashboard, / → /ar. */
export const withLang = (lang, route) => `/${lang}${route === '/' ? '' : route}`;

/** `route` without its language: /ar/dashboard → /dashboard, /en → /. */
export const stripLang = (route) => route.replace(new RegExp(`^/(${LANGS.join('|')})(?=/|$)`), '') || '/';

/** --lang-in path: each route under each language; storage: as given. */
export function localizedRoutes(routes, langIn = 'storage') {
  if (langIn === 'storage') return routes;
  if (langIn !== 'path') throw new Error(`--lang-in must be storage or path, not "${langIn}"`);
  return LANGS.flatMap((lang) => routes.map((route) => withLang(lang, route)));
}
