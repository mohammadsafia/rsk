import { type ChangeEvent, type ClipboardEvent, type FocusEvent, type KeyboardEvent, type ReactElement, useState } from 'react';

import { useController } from 'react-hook-form';

import { fieldVariants, Tag } from '@components/ui';

import { FormField } from '@components/forms';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { AlertCircle } from 'lucide-react';

import { type InviteForm, isEmail } from './InviteMembersDialog.schemas';

type EmailsFieldProps = {
  /** Addresses the server refused, with its reason: their chips are marked. */
  failures: Record<string, string>;
};

/** Commas, semicolons, spaces and new lines all end an address. */
const SEPARATORS = /[\s,;]+/;

/**
 * The invitees as removable chips. Typing a separator, pressing Enter, pasting or leaving the field turns the text into
 * chips (an address already in the list is skipped); Backspace in the empty input removes the last chip.
 */
function EmailsField({ failures }: EmailsFieldProps): ReactElement {
  const { t } = useAppTranslation('block-invite-members-dialog');

  const { field, fieldState } = useController<InviteForm, 'emails'>({ name: 'emails' });

  const [draft, setDraft] = useState('');

  /** Not an address, or refused by the server: the chip is marked. */
  const flagged = (email: string) => !isEmail(email) || email in failures;

  const handleAdd = (text: string) => {
    const known = new Set(field.value.map((email) => email.toLowerCase()));
    const added = text
      .split(SEPARATORS)
      .map((email) => email.trim())
      .filter((email) => {
        if (!email || known.has(email.toLowerCase())) return false;
        known.add(email.toLowerCase());
        return true;
      });
    if (added.length) field.onChange([...field.value, ...added]);
  };

  const handleRemove = (email: string) => field.onChange(field.value.filter((item) => item !== email));

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Everything before the last separator is finished: it becomes chips, the rest stays in the input.
    const parts = event.target.value.split(SEPARATORS);
    if (parts.length > 1) handleAdd(parts.slice(0, -1).join(' '));
    setDraft(parts.at(-1) ?? '');
  };

  // The handlers below read what the input shows, not `draft`: a key can arrive before the last change has rendered,
  // and Enter on a stale empty draft would send the form instead of finishing the address.
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const text = event.currentTarget.value;
    if (event.key === 'Enter' && text.trim()) {
      // An address in progress becomes a chip; with nothing typed, Enter sends the form.
      event.preventDefault();
      handleAdd(text);
      setDraft('');
    } else if (event.key === 'Backspace' && !text && field.value.length) {
      field.onChange(field.value.slice(0, -1));
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    handleAdd(`${event.currentTarget.value} ${event.clipboardData.getData('text')}`);
    setDraft('');
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    // Leaving the field (e.g. for the send button) keeps what was typed.
    if (event.currentTarget.value.trim()) handleAdd(event.currentTarget.value);
    setDraft('');
    field.onBlur();
  };

  return (
    <FormField label={t('emails')} description={t('emailsHint')} required error={fieldState.error}>
      {({ invalid, ...control }) => (
        <div
          data-slot="invite-emails"
          data-invalid={invalid || undefined}
          className={cn(fieldVariants({ size: 'md' }), 'data-invalid:border-danger h-auto min-h-control-md flex-wrap gap-1.5 px-2 py-1.5')}
        >
          <Conditional.If condition={field.value.length > 0}>
            <ul aria-label={t('emails')} className="flex min-w-0 flex-wrap gap-1.5">
              {field.value.map((email) => (
                <li key={email} data-slot="invite-email" data-email={email} data-invalid={flagged(email) || undefined}>
                  <Tag tone={flagged(email) ? 'danger' : 'neutral'} label={email} onRemove={() => handleRemove(email)}>
                    <Conditional.If condition={flagged(email)}>
                      <AlertCircle aria-hidden="true" className="size-3 shrink-0" />
                    </Conditional.If>

                    <bdi>{email}</bdi>

                    <Conditional.If condition={!isEmail(email)}>
                      <span className="sr-only"> {t('notValid')}</span>
                    </Conditional.If>
                  </Tag>
                </li>
              ))}
            </ul>
          </Conditional.If>

          <input
            {...control}
            ref={field.ref}
            name={field.name}
            type="text"
            inputMode="email"
            autoComplete="off"
            aria-invalid={invalid || undefined}
            value={draft}
            className="text-fg placeholder:text-fg-muted min-w-40 flex-1 bg-transparent text-sm outline-none"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={handleBlur}
          />
        </div>
      )}
    </FormField>
  );
}

export default EmailsField;
