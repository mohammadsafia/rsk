// What search engines and link previews read about a page: its canonical URL, the same page in the other language,
// and the Open Graph and Twitter data. Paths stay relative; the root layout's metadataBase makes them absolute.
import 'server-only';

import type { Metadata } from 'next';

import type { KitLanguage } from '@contexts';

import { clientEnv, LANGS } from '@env';

const SITE_NAME = 'RSK';

/** Open Graph wants a territory too. */
const OG_LOCALE: Record<KitLanguage, string> = { en: 'en_US', ar: 'ar_AR' };

/** `path` under `lang`: /login → /ar/login, / → /ar. */
const localized = (lang: KitLanguage, path: string) => `/${lang}${path === '/' ? '' : path}`;

/** An absolute URL on this site, keeping a base path (https://x.com/app + /en → https://x.com/app/en). */
export function siteUrl(path: string, base: string = clientEnv.NEXT_PUBLIC_SITE_URL): string {
  return `${base.replace(/\/+$/, '')}${path}`;
}

type PageSeo = { lang: KitLanguage; path: string; title: string; description?: string };

/**
 * A page's metadata. `path` is language-free (/login). x-default is that path without a language, where the proxy
 * picks one for the visitor. Next replaces openGraph and twitter whole, so each page sends both complete.
 */
export function pageMetadata({ lang, path, title, description }: PageSeo): Metadata {
  const url = localized(lang, path);
  const text = { title, ...(description ? { description } : {}) };
  return {
    ...text,
    alternates: {
      canonical: url,
      languages: { ...Object.fromEntries(LANGS.map((each) => [each, localized(each, path)])), 'x-default': path },
    },
    openGraph: { type: 'website', siteName: SITE_NAME, ...text, locale: OG_LOCALE[lang], url },
    twitter: { card: 'summary_large_image', ...text },
  };
}
