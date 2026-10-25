'use server';

import { z } from 'zod';

import type { Member } from '@api/handlers/members';
import { DEFAULT_LANG, isLang } from '@env';
import { type InviteResult, inviteSchema } from '@pages/members/inviteSchema';
import { callApi } from '@server/api';
import { getT } from '@server/i18n';
import { getServerSession } from '@server/session';

/**
 * Invite a member: the form's own schema checks the input again here (a browser can send anything), the session is
 * checked here too (an action is a public endpoint), and the API's refusals come back as field errors.
 */
export async function inviteMember(lang: string, input: unknown): Promise<InviteResult> {
  const t = await getT(isLang(lang) ? lang : DEFAULT_LANG, 'members');
  const session = await getServerSession().catch(() => null);
  if (!session) return { ok: false, formError: t('invite.signedOut') };

  const parsed = inviteSchema(t).safeParse(input);
  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return { ok: false, fieldErrors: Object.fromEntries(Object.entries(fieldErrors).map(([field, messages]) => [field, messages?.[0]])) };
  }

  const { status, body } = await callApi(session, { method: 'POST', path: '/members', body: parsed.data });
  // The cookie is still good but the API no longer takes its token (expired or revoked there).
  if (status === 401) return { ok: false, formError: t('invite.signedOut') };
  if (status === 409) return { ok: false, fieldErrors: { email: t('invite.errors.taken') } };
  if (status !== 200 && status !== 201) return { ok: false, formError: t('invite.failed') };
  return { ok: true, member: body as Member };
}
