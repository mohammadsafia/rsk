'use client';

import {
  type ChangeEvent,
  type ClipboardEvent,
  type ComponentPropsWithRef,
  type FC,
  type FocusEvent,
  type KeyboardEvent,
  useState,
} from 'react';

import { fieldVariants, Tag } from '@components/ui';

import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { AlertCircle } from 'lucide-react';

export type ChipInputProps = Omit<ComponentPropsWithRef<'input'>, 'value' | 'defaultValue' | 'onChange' | 'size'> & {
  value: string[];
  onChange: (value: string[]) => void;
  /** False for an item that isn't valid: its chip is marked, and `invalidLabel` is read with it. */
  validate?: (item: string) => boolean;
  /** Items marked from outside (e.g. refused by the server), each with the reason read with its chip. */
  flagged?: Record<string, string>;
  invalid?: boolean;
  /** Names the list of chips for screen readers (usually the field's label). */
  listLabel?: string;
  /** Read after an item that fails `validate`. @default t('chipInput.invalid') */
  invalidLabel?: string;
  /** What ends an item while typing or pasting. @default commas, semicolons, spaces and new lines */
  separators?: RegExp;
};

const SEPARATORS = /[\s,;]+/;

/**
 * Several values in one field, as removable chips: typing a separator, pressing Enter, pasting or leaving the field
 * turns the text into chips (one already there, in any case, is skipped), and Backspace in the empty input removes the
 * last. The field grows with its chips; typing continues after the last one.
 */
const ChipInput: FC<ChipInputProps> = ({
  ref,
  value,
  onChange,
  validate,
  flagged = {},
  invalid = false,
  listLabel,
  invalidLabel,
  separators = SEPARATORS,
  placeholder,
  className,
  onBlur,
  ...props
}) => {
  const { t } = useAppTranslation('common');

  const [draft, setDraft] = useState('');

  const notValid = invalidLabel ?? t('chipInput.invalid', { defaultValue: '(not valid)' });
  const failsValidation = (item: string) => !!validate && !validate(item);
  const marked = (item: string) => failsValidation(item) || item in flagged;

  const handleAdd = (text: string) => {
    const known = new Set(value.map((item) => item.toLowerCase()));
    const added = text
      .split(separators)
      .map((item) => item.trim())
      .filter((item) => {
        if (!item || known.has(item.toLowerCase())) return false;
        known.add(item.toLowerCase());
        return true;
      });
    if (added.length) onChange([...value, ...added]);
  };

  const handleRemove = (item: string) => onChange(value.filter((existing) => existing !== item));

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Everything before the last separator is finished: it becomes chips, the rest stays in the input.
    const parts = event.target.value.split(separators);
    if (parts.length > 1) handleAdd(parts.slice(0, -1).join(' '));
    setDraft(parts.at(-1) ?? '');
  };

  // These read what the input shows, not `draft`: a key can arrive before the last change has rendered, and Enter on a
  // stale empty draft would submit the form instead of finishing the item.
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const text = event.currentTarget.value;
    if (event.key === 'Enter' && text.trim()) {
      // An item in progress becomes a chip; with nothing typed, Enter submits the form.
      event.preventDefault();
      handleAdd(text);
      setDraft('');
    } else if (event.key === 'Backspace' && !text && value.length) {
      onChange(value.slice(0, -1));
    }
    props.onKeyDown?.(event);
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    handleAdd(`${event.currentTarget.value} ${event.clipboardData.getData('text')}`);
    setDraft('');
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    // Leaving the field (e.g. for a submit button) keeps what was typed.
    if (event.currentTarget.value.trim()) handleAdd(event.currentTarget.value);
    setDraft('');
    onBlur?.(event);
  };

  return (
    <div
      data-slot="chip-input"
      data-invalid={invalid || undefined}
      // No size variant: its fixed height would keep a second row of chips outside the box. The box grows with the
      // chips instead, keeping an even inset around them; typed text starts where other fields' text does.
      className={cn(
        fieldVariants({ size: null }),
        'data-invalid:border-danger min-h-control-md flex-wrap content-center items-center gap-1 py-0.5 ps-1 pe-2 text-sm',
        className,
      )}
    >
      <Conditional.If condition={value.length > 0}>
        {/* `contents`: the chips and the input share one row flow. The explicit role keeps the list a list (some
            browsers drop it with display: contents). */}
        <ul role="list" aria-label={listLabel} className="contents">
          {value.map((item) => (
            <li key={item} data-slot="chip-input-chip" data-value={item} data-invalid={marked(item) || undefined}>
              <Tag tone={marked(item) ? 'danger' : 'neutral'} label={item} onRemove={() => handleRemove(item)}>
                <Conditional.If condition={marked(item)}>
                  <AlertCircle aria-hidden="true" className="size-3 shrink-0" />
                </Conditional.If>

                <bdi>{item}</bdi>

                <Conditional.If condition={marked(item)}>
                  <span className="sr-only"> {flagged[item] ?? notValid}</span>
                </Conditional.If>
              </Tag>
            </li>
          ))}
        </ul>
      </Conditional.If>

      <input
        ref={ref}
        type="text"
        autoComplete="off"
        aria-invalid={invalid || undefined}
        placeholder={value.length ? undefined : placeholder}
        value={draft}
        className="text-fg placeholder:text-fg-muted h-6 min-w-24 flex-1 bg-transparent px-2 text-sm outline-none"
        {...props}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={handleBlur}
      />
    </div>
  );
};

ChipInput.displayName = 'ChipInput';

export default ChipInput;
