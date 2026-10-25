import type { Metadata } from 'next';

import { isLang } from '@env';
import ForgotPasswordPage from '@pages/auth/ForgotPasswordPage';
import { getT } from '@server/i18n';

import { AuthFrame } from '../auth-frame';
import { type AuthPageProps, readAuthPage } from '../auth-page';

export async function generateMetadata({ params }: Pick<AuthPageProps, 'params'>): Promise<Metadata> {
  const { lang } = await params;
  return isLang(lang) ? { title: (await getT(lang, 'auth'))('forgot.title') } : {};
}

export default async function Page(props: AuthPageProps) {
  const { redirectTo } = await readAuthPage(props);
  return (
    <AuthFrame redirectTo={redirectTo}>
      <ForgotPasswordPage />
    </AuthFrame>
  );
}
