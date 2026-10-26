import type { ReactNode } from 'react';

import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';

import { THEME_COLORS } from '@app-config';
import { blockNavLabels } from '@blocks';
import { LOCALES } from '@locales';

import { dirOf, isLang, LANGS } from '@env';
import { getT } from '@server/i18n';
import { fontVariables } from '../fonts';
import { Providers } from './providers';
import { THEME_SCRIPT } from '../theme-script';

import '../../src/index.css';

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
        <Providers lang={lang} resources={{ ...LOCALES[lang === 'ar' ? 'AR' : 'EN'], ...blockNavLabels[lang] }}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
