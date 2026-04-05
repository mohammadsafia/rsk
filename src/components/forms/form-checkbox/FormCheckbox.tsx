import { type ComponentPropsWithoutRef, useId } from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { FormControl, FormLabel, FormMessage } from '@components/forms';
import { Checkbox } from '@components/ui';

import { cn } from '@utils';

import type { ControlledFieldBaseProps } from '@app-types';

type FormCheckboxProps<TFieldValues extends FieldValues> = Omit<
  ControlledFieldBaseProps<TFieldValues, ComponentPropsWithoutRef<typeof Checkbox>>,
  'onChange'
> & {
  checkboxClassName?: string;
  onChange?: (checked: boolean | string) => void;
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
        <FormControl className={containerClassName}>
          <FormLabel className={labelClassName} hidden={!label} error={error!} htmlFor={id} required={required}>
            {label}
          </FormLabel>

          <label
            htmlFor={id}
            className={cn(
              'border-muted-200 bg-background relative flex w-full cursor-pointer items-center gap-3 rounded-md border p-3 transition-[color,box-shadow]',
              !!field.value && 'bg-secondary-100 border-secondary-200',
              !disabled &&
                'hover:border-primary hover:ring-primary focus-visible:ring-primary focus-visible:border-primary hover:ring focus-visible:ring focus-visible:outline-none',
              !disabled &&
                !!field.value &&
                'hover:border-secondary-200 hover:ring-secondary-200 focus-visible:border-secondary-200 focus-visible:ring-secondary-200',
              disabled && 'bg-muted-50 text-muted-300 pointer-events-none',
              disabled && !!field.value && 'border-muted-200',
              error && 'border-destructive text-destructive',
              !disabled && error && 'hover:border-destructive hover:ring-destructive focus-visible:ring-destructive',
              className,
            )}
          >
            <span className="flex flex-1 items-center text-sm font-normal">{label}</span>

            <Checkbox
              id={id}
              ref={field.ref}
              name={field.name}
              className={cn(
                error && 'border-destructive hover:not-disabled:border-destructive hover:not-disabled:ring-destructive',
                checkboxClassName,
              )}
              checked={!!field.value}
              disabled={field.disabled || disabled}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                onChange?.(checked);
              }}
              onBlur={field.onBlur}
              {...props}
            />

            <FormMessage className={cn('inset-s-auto inset-e-9', errorClassName)} hidden={!error} error={error!} />
          </label>
        </FormControl>
      )}
    />
  );
}

FormCheckbox.displayName = 'FormCheckbox';

export default FormCheckbox;
