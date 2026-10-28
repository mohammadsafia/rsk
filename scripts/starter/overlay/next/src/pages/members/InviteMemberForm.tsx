'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';

import { Alert, Button, Sheet } from '@components/ui';
import { FormContainer, FormInput, FormSelect } from '@components/forms';
import { Conditional } from '@components/utils';

import { toast, useAppTranslation } from '@hooks/shared';

import { formResolver } from '@utils';

import { MEMBERS_QUERY_KEY } from '@api/handlers/members';

import { type InviteInput, type InviteMember, type InviteResult, inviteSchema, MEMBER_ROLES } from './inviteSchema';

type InviteMemberFormProps = { open: boolean; onOpenChange: (open: boolean) => void; invite: InviteMember };

type RoleOption = { id: InviteInput['role']; name: string };

const EMPTY: InviteInput = { name: '', email: '', role: 'member' };

/** Invite a member through a server action. The form checks first; the server checks again and may refuse a field. */
function InviteMemberForm({ open, onOpenChange, invite }: InviteMemberFormProps) {
  const { t, i18n } = useAppTranslation('members');
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<InviteInput>({ resolver: formResolver<InviteInput>(inviteSchema(t)), defaultValues: EMPTY });
  const roles = useMemo<RoleOption[]>(() => MEMBER_ROLES.map((role) => ({ id: role, name: t(`roles.${role}`) })), [t]);

  const handleSubmit = async (values: InviteInput) => {
    setFormError(null);
    let result: InviteResult;
    try {
      result = await invite(i18n.language, values);
    } catch {
      // The action never answered: offline, refused, or gone after a deploy (the page is older than the server).
      setFormError(t('invite.failed'));
      return;
    }
    if (!result.ok) {
      for (const [field, message] of Object.entries(result.fieldErrors ?? {}))
        if (message) form.setError(field as keyof InviteInput, { message }, { shouldFocus: true });
      setFormError(result.formError ?? null);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEY });
    toast({ title: t('invite.sent', { name: result.member.name }), tone: 'success' });
    form.reset(EMPTY);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Sheet.Content side="end" size="md" title={t('invite.title')}>
        <FormContainer formContext={form} className="flex min-h-0 flex-1 flex-col" onSuccess={handleSubmit}>
          <Sheet.Body className="flex flex-col gap-4">
            <Conditional.If condition={!!formError}>
              <Alert tone="danger">
                <Alert.Description>{formError}</Alert.Description>
              </Alert>
            </Conditional.If>
            <FormInput<InviteInput> name="name" label={t('invite.name')} autoComplete="off" required />
            <FormInput<InviteInput> name="email" label={t('invite.email')} type="email" dir="ltr" autoComplete="off" required />
            <FormSelect<InviteInput, RoleOption>
              name="role"
              control={form.control}
              label={t('invite.role')}
              options={roles}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
            />
          </Sheet.Body>
          <Sheet.Footer>
            <Button type="submit" loading={form.formState.isSubmitting}>
              {t('invite.submit')}
            </Button>
            <Sheet.Close asChild>
              <Button type="button" variant="ghost" className="ms-auto">
                {t('invite.cancel')}
              </Button>
            </Sheet.Close>
          </Sheet.Footer>
        </FormContainer>
      </Sheet.Content>
    </Sheet>
  );
}

export default InviteMemberForm;
