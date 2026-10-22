'use client';

import { type ReactElement, useEffect, useRef, useState } from 'react';

import { useForm } from 'react-hook-form';

import { Alert, Button, Dialog } from '@components/ui';

import { FormChipInput, FormContainer, FormSelect } from '@components/forms';
import { Conditional } from '@components/utils';

import { toast, useBlockTranslation } from '@hooks/shared';

import { formResolver } from '@utils';

import { LOCALE } from './locale';
import { type InviteForm, inviteSchema, isEmail } from './InviteMembersDialog.schemas';

export type InviteRole = { value: string; label: string };
export type Invite = { email: string; role: string };
/** `failed` maps each address the server refused to the reason to show; the rest were sent. */
export type InviteResult = { failed?: Record<string, string> } | void;

export type InviteMembersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: InviteRole[];
  /** @default the first role */
  defaultRole?: string;
  /** Sends the invitations. Reject when nothing went out; resolve `{ failed }` when only some did. */
  onInvite: (invites: Invite[]) => Promise<InviteResult>;
};

/**
 * Invites people by email with one role for all of them. Addresses the server refuses stay in the dialog with their
 * reason; the ones sent leave it, and a toast confirms them.
 */
function InviteMembersDialog({ open, onOpenChange, roles, defaultRole, onInvite }: InviteMembersDialogProps): ReactElement {
  const { t } = useBlockTranslation('block-invite-members-dialog', LOCALE);

  const form = useForm<InviteForm>({
    defaultValues: { emails: [], role: defaultRole ?? roles[0]?.value ?? '' },
    resolver: formResolver<InviteForm>(inviteSchema({ required: t('required'), invalid: t('invalidEmail'), role: t('roleRequired') })),
  });

  // Set when a send leaves addresses to fix: the focus returns to them once the form is enabled again.
  const refocus = useRef(false);

  const [failures, setFailures] = useState<Record<string, string>>({});
  const [sendFailed, setSendFailed] = useState(false);

  const submitting = form.formState.isSubmitting;
  const failedList = Object.entries(failures);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset();
      setFailures({});
      setSendFailed(false);
    }
    onOpenChange(next);
  };

  const handleInvite = async ({ emails, role }: InviteForm) => {
    setSendFailed(false);
    try {
      const failed = (await onInvite(emails.map((email) => ({ email, role }))))?.failed ?? {};
      const sent = emails.filter((email) => !(email in failed));
      if (sent.length) toast({ title: t('sent', { count: sent.length }), tone: 'success' });
      if (sent.length === emails.length) {
        handleOpenChange(false);
        return;
      }
      // Only the refused addresses stay, with their reasons, so sending again retries just those.
      setFailures(failed);
      form.setValue(
        'emails',
        emails.filter((email) => email in failed),
      );
      refocus.current = true;
    } catch {
      // Nothing went out: every address stays, and the message says to try again.
      setSendFailed(true);
      refocus.current = true;
    }
  };

  // The send button was disabled while sending, which drops the focus: put it back in the addresses.
  useEffect(() => {
    if (!refocus.current || submitting) return;
    refocus.current = false;
    form.setFocus('emails');
  }, [submitting, form]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content title={t('title')} description={t('description')} dismissible={!submitting}>
        <FormContainer formContext={form} onSuccess={handleInvite} className="flex flex-col gap-4">
          <fieldset disabled={submitting} className="flex min-w-0 flex-col gap-4">
            <FormChipInput<InviteForm>
              name="emails"
              label={t('emails')}
              description={t('emailsHint')}
              placeholder={t('emailsPlaceholder')}
              invalidLabel={t('notValid')}
              inputMode="email"
              required
              validate={isEmail}
              flagged={failures}
            />

            <FormSelect<InviteForm, InviteRole>
              name="role"
              label={t('role')}
              options={roles}
              getOptionLabel={(role) => role.label}
              getOptionValue={(role) => role.value}
              clearable={false}
              required
            />

            <Conditional.If condition={failedList.length > 0}>
              <Alert tone="danger">
                <Alert.Title>{t('notSent')}</Alert.Title>

                <Alert.Description>
                  <ul className="flex flex-col gap-1">
                    {failedList.map(([email, reason]) => (
                      <li key={email}>
                        <bdi className="font-medium">{email}</bdi> — <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </Alert.Description>
              </Alert>
            </Conditional.If>

            <Conditional.If condition={sendFailed}>
              <Alert tone="danger">
                <Alert.Description>{t('failed')}</Alert.Description>
              </Alert>
            </Conditional.If>
          </fieldset>

          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                {t('cancel')}
              </Button>
            </Dialog.Close>

            <Button type="submit" loading={submitting}>
              {t('submit')}
            </Button>
          </Dialog.Footer>
        </FormContainer>
      </Dialog.Content>
    </Dialog>
  );
}

export default InviteMembersDialog;
