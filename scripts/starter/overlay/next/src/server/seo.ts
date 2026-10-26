// What search engines and link previews read about a page: its canonical URL, the same page in the other language,
// and the Open Graph and Twitter data. Paths stay relative; the root layout's metadataBase makes them absolute.
import 'server-only';

import type { Metadata } from 'next';

import type { KitLanguage } from '@contexts';

import { clientEnv, LANGS } from '@env';

const SITE_NAME = 'RSK';

/**
 * The link preview app/[lang]/opengraph-image.tsx draws. Named here because a page's openGraph replaces the one that
 * file would add, so without it no page would have an image.
 */
const ogImage = (lang: KitLanguage) => `/${lang}/opengraph-image`;

/** Open Graph wants a territory too. */
const OG_LOCALE: Record<KitLanguage, string> = { en: 'en_US', ar: 'ar_AR' };

/** `path` under `lang`: /login → /ar/login, / → /ar. */
export const localizedPath = (lang: KitLanguage, path: string): string => `/${lang}${path === '/' ? '' : path}`;

/** An absolute URL on this site, keeping a base path (https://x.com/app + /en → https://x.com/app/en). */
export function siteUrl(path: string, base: string = clientEnv.NEXT_PUBLIC_SITE_URL): string {
  return `${base.replace(/\/+$/, '')}${path}`;
}

type PageSeo = {
  lang: KitLanguage;
  path: string;
  title: string;
  description?: string;
  /** The title already names the site (a home page): no "· RSK" after it. */
  absoluteTitle?: boolean;
};

/**
 * A page's metadata. `path` is language-free (/login). x-default is that path without a language, where the proxy
 * picks one for the visitor. Next replaces openGraph and twitter whole, so each page sends both complete.
 */
export function pageMetadata({ lang, path, title, description, absoluteTitle }: PageSeo): Metadata {
  const url = localizedPath(lang, path);
  const text = { title, ...(description ? { description } : {}) };
  return {
    ...text,
    ...(absoluteTitle ? { title: { absolute: title } } : {}),
    alternates: {
      canonical: url,
      languages: { ...Object.fromEntries(LANGS.map((each) => [each, localizedPath(each, path)])), 'x-default': path },
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      ...text,
      locale: OG_LOCALE[lang],
      url,
      images: [{ url: ogImage(lang), width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: { card: 'summary_large_image', ...text, images: [ogImage(lang)] },
  };
}
