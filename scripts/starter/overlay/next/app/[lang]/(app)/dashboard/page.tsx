import type { Metadata } from 'next';

import { isLang } from '@env';
import DashboardPage from '@pages/dashboard/DashboardPage';
import { getT } from '@server/i18n';
import { pageMetadata } from '@server/seo';
import { requireSession } from '@server/session';

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  return isLang(lang) ? pageMetadata({ lang, path: '/dashboard', title: (await getT(lang, 'nav'))('dashboard') }) : {};
}

export default async function Page({ params }: PageProps) {
  const { lang } = await params;
  if (isLang(lang)) await requireSession(lang);
  return <DashboardPage />;
}
