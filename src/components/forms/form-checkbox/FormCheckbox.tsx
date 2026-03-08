import { type InputHTMLAttributes, useId } from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { FormControl, FormLabel, FormMessage } from '@components/forms';
import { Checkbox } from '@components/ui';

import { cn } from '@utils';

import type { ControlledFieldBaseProps } from '@app-types';

type FormCheckboxProps<TFieldValues extends FieldValues> = ControlledFieldBaseProps<TFieldValues, InputHTMLAttributes<HTMLInputElement>> & {
  checkboxClassName?: string;
};

function FormCheckbox<TFieldValues extends FieldValues>({
  name,
  rules,
  control,
  label,
  containerClassName,
  labelClassName,
  className,
  errorClassName,
  required,
  disabled,
  checkboxClassName,
}: FormCheckboxProps<TFieldValues>) {
  const id = `${name}-${useId()}`;

  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <FormControl className={containerClassName}>
          <FormLabel className={labelClassName} hidden={!label} error={error!} htmlFor={id} required={required}>
            {label}
          </FormLabel>

          <label
            htmlFor={id}
            className={cn(
              'border-muted-200 bg-surface relative flex h-10.5 w-full cursor-pointer items-center gap-3 rounded-md border px-3 py-2',
              !!field.value && 'bg-secondary-100',
              disabled && 'cursor-not-allowed opacity-70',
              error && 'ring-destructive ring-1',
              className,
            )}
          >
            <span
              className={cn(
                'flex flex-1 items-center text-sm font-normal',
                field.value ? 'text-primary-900' : 'text-muted',
                disabled && 'text-muted-300',
              )}
            >
              {label}
            </span>

            <Checkbox
              id={id}
              checked={!!field.value}
              onCheckedChange={field.onChange}
              disabled={field.disabled || disabled}
              className={cn(error && 'border-destructive data-[state=checked]:bg-destructive', checkboxClassName)}
            />

            <FormMessage className={cn('start-auto end-9', errorClassName)} hidden={!error} error={error!} />
          </label>
        </FormControl>
      )}
    />
  );
}

FormCheckbox.displayName = 'FormCheckbox';

export default FormCheckbox;
