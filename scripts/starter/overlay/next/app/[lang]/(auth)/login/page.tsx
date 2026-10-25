import type { Metadata } from 'next';

import { DEMO_CREDENTIALS } from '@api/mock/auth';
import { isLang } from '@env';
import LoginPage from '@pages/auth/LoginPage';
import { getT } from '@server/i18n';

import { AuthFrame } from '../auth-frame';
import { type AuthPageProps, demoAccountOn, readAuthPage } from '../auth-page';

export async function generateMetadata({ params }: Pick<AuthPageProps, 'params'>): Promise<Metadata> {
  const { lang } = await params;
  return isLang(lang) ? { title: (await getT(lang, 'auth'))('login.title') } : {};
}

export default async function Page(props: AuthPageProps) {
  const { redirectTo } = await readAuthPage(props);
  return (
    <AuthFrame redirectTo={redirectTo}>
      <LoginPage demo={demoAccountOn() ? DEMO_CREDENTIALS : null} />
    </AuthFrame>
  );
}
