import type { CSSProperties, ReactNode } from 'react';

import type { Metadata, Viewport } from 'next';
import { Noto_Kufi_Arabic, Schibsted_Grotesk, Spline_Sans_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';

import { THEME_COLORS } from '@app-config';
import { LOCALES } from '@locales';

import { dirOf, isLang, LANGS } from '@env';
import { getT } from '@server/i18n';
import { Providers } from './providers';
import { THEME_SCRIPT } from './theme-script';

import '../../src/index.css';

const sans = Schibsted_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' });
const arabic = Noto_Kufi_Arabic({ subsets: ['arabic'], weight: ['400', '500', '600'], display: 'swap' });
const mono = Spline_Sans_Mono({ subsets: ['latin'], weight: ['400', '500'], display: 'swap' });

// Only the real family: next/font's size-adjusted fallback (local Arial, no unicode-range) would catch Arabic glyphs
// before Noto Kufi does. theme.css builds the per-glyph stacks from these variables.
const firstFamily = (stack: string) => stack.split(',')[0].trim();
const fontVariables = {
  '--font-brand-sans': firstFamily(sans.style.fontFamily),
  '--font-brand-arabic': firstFamily(arabic.style.fontFamily),
  '--font-brand-mono': firstFamily(mono.style.fontFamily),
} as CSSProperties;

type LayoutProps = { children: ReactNode; params: Promise<{ lang: string }> };

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Pick<LayoutProps, 'params'>): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = await getT(lang, 'common');
  return {
    title: { template: '%s · RSK', default: 'RSK' },
    description: t('app.description'),
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon.ico', sizes: '32x32' },
      ],
      apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: THEME_COLORS.dark },
    { media: '(prefers-color-scheme: light)', color: THEME_COLORS.light },
  ],
};

/** The page frame: language and direction from the URL, fonts, the theme before first paint. Reads nothing per request. */
export default async function Layout({ children, params }: LayoutProps) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <html lang={lang} dir={dirOf(lang)} style={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <Providers lang={lang} resources={LOCALES[lang === 'ar' ? 'AR' : 'EN']}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
