// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { pageMetadata, siteUrl } from './seo';

describe('pageMetadata', () => {
  it('gives the page its canonical URL, the other language, x-default and Open Graph data', () => {
    expect(pageMetadata({ lang: 'ar', path: '/login', title: 'T', description: 'D' })).toEqual({
      title: 'T',
      description: 'D',
      alternates: { canonical: '/ar/login', languages: { en: '/en/login', ar: '/ar/login', 'x-default': '/login' } },
      openGraph: {
        type: 'website',
        siteName: 'RSK',
        title: 'T',
        description: 'D',
        locale: 'ar_AR',
        url: '/ar/login',
        images: [{ url: '/ar/opengraph-image', width: 1200, height: 630, alt: 'RSK' }],
      },
      twitter: { card: 'summary_large_image', title: 'T', description: 'D', images: ['/ar/opengraph-image'] },
    });
  });

  it('a language home has no trailing slash, and x-default is the root that picks a language', () => {
    expect(pageMetadata({ lang: 'en', path: '/', title: 'T' }).alternates).toEqual({
      canonical: '/en',
      languages: { en: '/en', ar: '/ar', 'x-default': '/' },
    });
  });

  it('a title that already names the site skips the layout template, in search results and previews alike', () => {
    const metadata = pageMetadata({ lang: 'en', path: '/', title: 'Build on RSK', absoluteTitle: true });
    expect(metadata.title).toEqual({ absolute: 'Build on RSK' });
    expect(metadata.openGraph?.title).toBe('Build on RSK');
  });
});

describe('siteUrl', () => {
  it('joins a path onto the site URL, keeping its own path and dropping a doubled slash', () => {
    expect(siteUrl('/en', 'https://x.com/app/')).toBe('https://x.com/app/en');
    expect(siteUrl('/en/login', 'https://x.com')).toBe('https://x.com/en/login');
    expect(siteUrl('/', 'https://x.com/')).toBe('https://x.com/');
  });
});
