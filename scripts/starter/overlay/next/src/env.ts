// What the browser may know: the languages in the URL and the public settings (NEXT_PUBLIC_*, inlined at build).
import { z } from 'zod';

import type { KitLanguage } from '@contexts';

import { DEFAULT_LANGUAGE, type LanguageDirection, LANGUAGES } from '@constants';

export const LANGS: readonly KitLanguage[] = [LANGUAGES.EN, LANGUAGES.AR];

export const DEFAULT_LANG: KitLanguage = DEFAULT_LANGUAGE;

export const isLang = (value: string | undefined): value is KitLanguage => LANGS.includes(value as KitLanguage);

export const dirOf = (lang: KitLanguage): LanguageDirection => (lang === LANGUAGES.AR ? 'rtl' : 'ltr');

export const clientEnv = z
  .object({ NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000') })
  .parse({ NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined });
