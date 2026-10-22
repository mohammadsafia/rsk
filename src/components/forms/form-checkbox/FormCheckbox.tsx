'use client';

import { type ComponentPropsWithoutRef, useId } from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { FormField } from '@components/forms';
import { Checkbox, Tooltip } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { Info } from 'lucide-react';

import type { ControlledFieldBaseProps } from '@app-types';

type FormCheckboxProps<TFieldValues extends FieldValues> = Omit<
  ControlledFieldBaseProps<TFieldValues, ComponentPropsWithoutRef<typeof Checkbox>>,
  'onChange'
> & {
  onChange?: (checked: boolean | string) => void;
};

/** A single consent-style checkbox: the box, then its label, inline. */
function FormCheckbox<TFieldValues extends FieldValues>({
  name,
  rules,
  control,
  label,
  description,
  tooltip,
  className,
  required,
  disabled,
  onChange,
  ...props
}: FormCheckboxProps<TFieldValues>) {
  const { t } = useAppTranslation('common');
  const id = `${name}-${useId()}`;

  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <FormField id={id} description={description} required={required} error={error}>
          {(fieldControl) => (
            <div data-slot="form-checkbox" className="flex items-center gap-1.5">
              {/* A plain inline choice (box + label), never a field-like card; min-h keeps a 28px target (WCAG 2.5.8). */}
              <label
                htmlFor={id}
                data-slot="form-checkbox-label"
                className={cn(
                  'text-fg min-h-control-sm inline-flex cursor-pointer items-center gap-2 text-sm',
                  disabled && 'pointer-events-none opacity-50',
                  className,
                )}
              >
                <Checkbox
                  {...fieldControl}
                  ref={field.ref}
                  name={field.name}
                  checked={!!field.value}
                  disabled={field.disabled || disabled}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    onChange?.(checked);
                  }}
                  onBlur={field.onBlur}
                  {...props}
                />

                <span>
                  {label}

                  <Conditional.If condition={!!required}>
                    <span aria-hidden="true" className="text-danger ms-0.5">
                      *
                    </span>
                  </Conditional.If>
                </span>
              </label>

              {/* Outside the <label> so its name never joins the checkbox's accessible name. */}
              <Conditional.If condition={!!tooltip}>
                <Tooltip content={tooltip} align="end">
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
          )}
        </FormField>
      )}
    />
  );
}

FormCheckbox.displayName = 'FormCheckbox';

export default FormCheckbox;
