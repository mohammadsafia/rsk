import type { Metadata } from 'next';

import { isLang } from '@env';
import LandingPage from '@pages/landing/LandingPage';
import { getT } from '@server/i18n';
import { pageMetadata } from '@server/seo';

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = await getT(lang, 'landing');
  return pageMetadata({ lang, path: '/', title: t('hero.title'), description: t('hero.description'), absoluteTitle: true });
}

/** The public front page, for everyone, signed in or not. */
export default function Page() {
  return <LandingPage />;
}
