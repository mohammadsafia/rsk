import type { MetadataRoute } from 'next';

import type { KitLanguage } from '@contexts';

import { LANGS } from '@env';
import { localizedPath, siteUrl } from '@server/seo';

/** The pages anyone can open. Add yours; pages behind sign-in stay out (robots.ts keeps crawlers away from them). */
const PUBLIC_PATHS = ['/', '/login', '/forgot-password'];

const url = (lang: KitLanguage, path: string) => siteUrl(localizedPath(lang, path));

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.flatMap((path) => {
    const languages = Object.fromEntries(LANGS.map((lang) => [lang, url(lang, path)]));
    return LANGS.map((lang) => ({ url: url(lang, path), alternates: { languages } }));
  });
}
