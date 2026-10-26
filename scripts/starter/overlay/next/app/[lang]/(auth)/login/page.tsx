import type { Metadata } from 'next';

import { DEMO_CREDENTIALS } from '@api/mock/auth';
import { isLang } from '@env';
import LoginPage from '@pages/auth/LoginPage';
import { getT } from '@server/i18n';
import { pageMetadata } from '@server/seo';

import { AuthFrame } from '../auth-frame';
import { type AuthPageProps, demoAccountOn, readAuthPage } from '../auth-page';

export async function generateMetadata({ params }: Pick<AuthPageProps, 'params'>): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = await getT(lang, 'auth');
  return pageMetadata({ lang, path: '/login', title: t('login.title'), description: t('login.subtitle') });
}

export default async function Page(props: AuthPageProps) {
  const { redirectTo } = await readAuthPage(props);
  return (
    <AuthFrame redirectTo={redirectTo}>
      <LoginPage demo={demoAccountOn() ? DEMO_CREDENTIALS : null} />
    </AuthFrame>
  );
}
