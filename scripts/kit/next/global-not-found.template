import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { DEFAULT_LANG, dirOf, isLang } from '@env';
import { getT } from '@server/i18n';

import { fontVariables } from './fonts';
import { THEME_SCRIPT } from './theme-script';

import '../src/index.css';

/** The visitor's language, from the path the proxy saw ("/ar/…"), since no route (and no [lang] param) matched. */
async function languageOf() {
  const first = ((await headers()).get('x-pathname') ?? '').split(/[/?#]/)[1];
  return isLang(first) ? first : DEFAULT_LANG;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT(await languageOf(), 'errors');
  return { title: `${t('notFound.title')} · RSK` };
}

/** A URL no route matches: the whole page, in the visitor's language and theme (it renders outside the app's layout). */
export default async function GlobalNotFound() {
  const lang = await languageOf();
  const t = await getT(lang, 'errors');

  return (
    <html lang={lang} dir={dirOf(lang)} style={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <main className="bg-canvas text-fg flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
          <h1 className="text-xl font-semibold">{t('notFound.title')}</h1>
          <p className="text-fg-muted max-w-sm text-sm">{t('notFound.description')}</p>
          <a
            href={`/${lang}`}
            className="focus-ring-input h-control-md border-border mt-3 inline-flex items-center rounded-md border px-4 text-sm"
          >
            {t('notFound.backHome')}
          </a>
        </main>
      </body>
    </html>
  );
}
