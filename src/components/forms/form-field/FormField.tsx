'use client';

import { type FC, type ReactNode, useId } from 'react';
import { type FieldError } from 'react-hook-form';
import * as LabelPrimitive from '@radix-ui/react-label';

import { Tooltip } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { AlertCircle, Info } from 'lucide-react';

/** What a field's control receives: wire these onto the focusable element (or the group root). */
export type FormFieldControlProps = {
  id: string;
  invalid: boolean;
  /** Set when there is a label; groups need it because `<label for>` can't name a `div`. */
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
};

export type FormFieldProps = {
  /** The control's id; generated when omitted. */
  id?: string;
  label?: ReactNode;
  /** Help text shown under the control while it is valid. */
  description?: ReactNode;
  /** Extra context behind an ⓘ button beside the label (never inside it). */
  tooltip?: ReactNode;
  required?: boolean;
  error?: FieldError;
  className?: string;
  children: (control: FormFieldControlProps) => ReactNode;
};

const FormField: FC<FormFieldProps> = ({ id, label, description, tooltip, required = false, error, className, children }) => {
  const { t } = useAppTranslation('common');
  const generatedId = useId();

  const controlId = id ?? generatedId;
  const labelId = `${controlId}-label`;
  const messageId = `${controlId}-message`;
  const message = error?.message || description;
  const hasMessage = message !== undefined && message !== null && message !== '';

  return (
    <div data-slot="form-field" data-invalid={!!error || undefined} className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Conditional.If condition={!!label}>
        <div data-slot="form-field-label" className="flex items-center gap-1">
          <LabelPrimitive.Root id={labelId} htmlFor={controlId} className="text-fg text-sm leading-none font-medium">
            {label}

            <Conditional.If condition={required}>
              <span aria-hidden="true" className="text-danger ms-0.5">
                *
              </span>
            </Conditional.If>
          </LabelPrimitive.Root>

          <Conditional.If condition={!!tooltip}>
            <Tooltip content={tooltip} align="start">
              <button
                type="button"
                aria-label={t('moreInfo')}
                className="focus-ring text-fg-muted hover:text-fg inline-flex cursor-help rounded-sm"
              >
                <Info size={14} aria-hidden="true" />
              </button>
            </Tooltip>
          </Conditional.If>
        </div>
      </Conditional.If>

      <div data-slot="form-field-control" className="relative min-w-0">
        {children({
          id: controlId,
          invalid: !!error,
          'aria-labelledby': label ? labelId : undefined,
          'aria-describedby': hasMessage ? messageId : undefined,
          'aria-required': required || undefined,
        })}
      </div>

      <Conditional.If condition={hasMessage}>
        <p
          id={messageId}
          data-slot="form-field-message"
          className={cn('flex items-start gap-1.5 text-xs', error ? 'text-danger' : 'text-fg-muted')}
        >
          <Conditional.If condition={!!error}>
            <AlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          </Conditional.If>

          <span>{message}</span>
        </p>
      </Conditional.If>
    </div>
  );
};

FormField.displayName = 'FormField';

export default FormField;
