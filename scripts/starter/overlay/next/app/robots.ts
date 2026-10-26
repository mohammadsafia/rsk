import type { MetadataRoute } from 'next';

import { LANGS } from '@env';
import { PROTECTED } from '@server/route-decision';
import { siteUrl } from '@server/seo';

/** Crawlers stay out of the API and the signed-in app (whose pages also answer noindex). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', ...LANGS.flatMap((lang) => PROTECTED.map((path) => `/${lang}${path}`))],
    },
    sitemap: siteUrl('/sitemap.xml'),
  };
}
