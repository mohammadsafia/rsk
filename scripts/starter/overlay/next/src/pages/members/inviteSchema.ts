// The invite form's rules, one schema for the browser (the form) and the server (the action), its messages in the
// visitor's language.
import { z } from 'zod';

import type { Member } from '@api/handlers/members';

export const MEMBER_ROLES = ['member', 'admin'] as const;

export const inviteSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().trim().min(1, t('invite.errors.name')).max(100, t('invite.errors.name')),
    email: z
      .string()
      .trim()
      .pipe(z.email(t('invite.errors.email'))),
    role: z.enum(MEMBER_ROLES, { error: t('invite.errors.role') }),
  });

export type InviteInput = z.infer<ReturnType<typeof inviteSchema>>;

/** What the action answers: the new member, or errors to show (under a field, or above the form). */
export type InviteResult =
  | { ok: true; member: Member }
  | { ok: false; fieldErrors?: Partial<Record<keyof InviteInput, string>>; formError?: string };

/** The invite server action, passed to the page by its route (app/[lang]/(app)/members). */
export type InviteMember = (lang: string, input: InviteInput) => Promise<InviteResult>;
