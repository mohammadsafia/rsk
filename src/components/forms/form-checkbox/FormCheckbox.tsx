import { type ComponentPropsWithoutRef, useId } from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { FormField } from '@components/forms';
import { Checkbox } from '@components/ui';

import { cn } from '@utils';

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
  className,
  required,
  disabled,
  onChange,
  ...props
}: FormCheckboxProps<TFieldValues>) {
  const id = `${name}-${useId()}`;

  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <FormField id={id} description={description} required={required} error={error}>
          {(fieldControl) => (
            <label
              htmlFor={id}
              data-slot="form-checkbox-card"
              className={cn(
                'border-border bg-surface text-fg flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors',
                'hover:border-border-strong has-data-[state=checked]:border-accent has-data-[state=checked]:bg-accent-subtle has-aria-invalid:border-danger',
                disabled && 'pointer-events-none opacity-50',
                className,
              )}
            >
              <span className="flex-1">{label}</span>

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
          )}
        </FormField>
      )}
    />
  );
}

FormCheckbox.displayName = 'FormCheckbox';

export default FormCheckbox;
