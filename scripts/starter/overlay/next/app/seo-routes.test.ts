// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { PROTECTED } from '@server/route-decision';

import robots from './robots';
import sitemap from './sitemap';

const SITE = 'http://localhost:3000';

describe('sitemap', () => {
  it('lists every public page in both languages, each pointing at the other', () => {
    const entries = sitemap();
    expect(entries.map((entry) => entry.url).sort()).toEqual(
      ['/ar', '/ar/forgot-password', '/ar/login', '/en', '/en/forgot-password', '/en/login'].map((path) => `${SITE}${path}`),
    );
    expect(entries.find((entry) => entry.url === `${SITE}/ar/login`)?.alternates?.languages).toEqual({
      en: `${SITE}/en/login`,
      ar: `${SITE}/ar/login`,
    });
  });

  it('lists no page behind sign-in', () => {
    for (const { url } of sitemap()) expect(PROTECTED.some((path) => new URL(url).pathname.endsWith(path))).toBe(false);
  });
});

describe('robots', () => {
  it('keeps crawlers out of the API and the signed-in app, and names the sitemap', () => {
    const { rules, sitemap: map } = robots();
    expect(rules).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', ...['en', 'ar'].flatMap((lang) => PROTECTED.map((path) => `/${lang}${path}`))],
    });
    expect(map).toBe(`${SITE}/sitemap.xml`);
  });
});
