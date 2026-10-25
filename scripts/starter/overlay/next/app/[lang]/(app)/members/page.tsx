import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { getQueryClient } from '@api/config/getQueryClient';
import { isLang } from '@env';
import MembersPage from '@pages/members/MembersPage';
import { getT } from '@server/i18n';
import { prefetchMembers } from '@server/members';
import { pageMetadata } from '@server/seo';
import { requireSession } from '@server/session';

import { inviteMember } from './actions';

type PageProps = { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  return isLang(lang) ? pageMetadata({ lang, path: '/members', title: (await getT(lang, 'members'))('title') }) : {};
}

/** The members example: the server fetches the page the URL asks for and sends it with the HTML; invites go through a server action. */
export default async function Page({ params, searchParams }: PageProps) {
  const { lang } = await params;
  if (!isLang(lang)) return null;
  const session = await requireSession(lang);
  const client = getQueryClient();
  await prefetchMembers(client, session, await searchParams);
  return (
    <HydrationBoundary state={dehydrate(client)}>
      <MembersPage invite={inviteMember} />
    </HydrationBoundary>
  );
}
