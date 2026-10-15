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

/** A single consent-style checkbox: the label sits inside a selectable card next to the box. */
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
            <div data-slot="form-checkbox" className="relative">
              <label
                htmlFor={id}
                data-slot="form-checkbox-card"
                className={cn(
                  'border-border bg-surface text-fg flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors',
                  'hover:border-border-strong has-data-[state=checked]:border-accent has-data-[state=checked]:bg-accent-subtle has-aria-invalid:border-danger',
                  !!tooltip && 'pe-14',
                  disabled && 'pointer-events-none opacity-50',
                  className,
                )}
              >
                <span className="flex-1">
                  {label}

                  <Conditional.If condition={!!required}>
                    <span aria-hidden="true" className="text-danger ms-0.5">
                      *
                    </span>
                  </Conditional.If>
                </span>

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
              </label>

              {/* Outside the <label> so its name never joins the checkbox's accessible name. */}
              <Conditional.If condition={!!tooltip}>
                <Tooltip content={tooltip} align="end">
                  <button
                    type="button"
                    aria-label={t('moreInfo')}
                    className="focus-ring text-fg-muted hover:text-fg absolute inset-y-0 end-10 my-auto inline-flex h-fit cursor-help rounded-sm"
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
