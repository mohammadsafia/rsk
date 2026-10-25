import type { Metadata } from 'next';

import { isLang } from '@env';
import { SettingsPlaceholder } from '@routes/RoutePlaceholders';
import { getT } from '@server/i18n';
import { requireSession } from '@server/session';

type PageProps = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  return isLang(lang) ? { title: (await getT(lang, 'nav'))('settings') } : {};
}

export default async function Page({ params }: PageProps) {
  const { lang } = await params;
  if (isLang(lang)) await requireSession(lang);
  return <SettingsPlaceholder />;
}
