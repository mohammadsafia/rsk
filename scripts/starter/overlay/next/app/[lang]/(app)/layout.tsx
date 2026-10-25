import type { ReactNode } from 'react';

import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { safeNext } from '@utils';

import { isLang } from '@env';
import { getServerSession, toClientSession } from '@server/session';

import { AppLayout, SIDEBAR_COOKIE } from './app-layout';

// Signed-in pages stay out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * The signed-in app: the session is checked here (the proxy only guessed from the cookie). Layouts don't re-run on
 * client navigation, so each page also calls requireSession; route handlers and server actions check on their own.
 */
export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const session = await getServerSession().catch(() => null);
  if (!session) {
    const here = safeNext((await headers()).get('x-pathname'), `/${lang}/dashboard`);
    redirect(`/${lang}/login?next=${encodeURIComponent(here)}`);
  }

  const sidebarCollapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === '1';
  return (
    <AppLayout session={toClientSession(session)} sidebarCollapsed={sidebarCollapsed}>
      {children}
    </AppLayout>
  );
}
