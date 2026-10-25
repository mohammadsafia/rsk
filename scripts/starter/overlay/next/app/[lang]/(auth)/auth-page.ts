// What both sign-in pages read on the server: the language, where to go after signing in, and whether the demo
// account is on.
import 'server-only';

import { notFound } from 'next/navigation';

import type { KitLanguage } from '@contexts';

import { isLang } from '@env';
import { stripLang } from '@routes/paths';
import { getServerEnv } from '@server/env';

import { acceptNext } from './redirect';

export type AuthPageProps = { params: Promise<{ lang: string }>; searchParams: Promise<{ next?: string | string[] }> };

export async function readAuthPage({ params, searchParams }: AuthPageProps): Promise<{ lang: KitLanguage; redirectTo: string }> {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const { next } = await searchParams;
  return { lang, redirectTo: stripLang(acceptNext(typeof next === 'string' ? next : null, lang)) };
}

/** The demo account is on (AUTH_MOCK); off when the server isn't configured. */
export function demoAccountOn(): boolean {
  try {
    return getServerEnv().AUTH_MOCK === 'true';
  } catch {
    return false;
  }
}
