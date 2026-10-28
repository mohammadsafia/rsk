import type { Metadata } from 'next';

import { isLang } from '@env';
import ForgotPasswordPage from '@pages/auth/ForgotPasswordPage';
import { getT } from '@server/i18n';
import { pageMetadata } from '@server/seo';

import { AuthFrame } from '../auth-frame';
import { type AuthPageProps, readAuthPage } from '../auth-page';

export async function generateMetadata({ params }: Pick<AuthPageProps, 'params'>): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = await getT(lang, 'auth');
  return pageMetadata({ lang, path: '/forgot-password', title: t('forgot.title'), description: t('forgot.subtitle') });
}

export default async function Page(props: AuthPageProps) {
  const { redirectTo } = await readAuthPage(props);
  return (
    <AuthFrame redirectTo={redirectTo}>
      <ForgotPasswordPage />
    </AuthFrame>
  );
}
