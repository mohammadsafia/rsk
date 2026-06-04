import { type InputHTMLAttributes, useId } from 'react';
import { type FieldValues, useController, useFormContext } from 'react-hook-form';

import { FormControl, FormLabel, FormMessage } from '@components/forms';
import { Input } from '@components/ui';

import { cn } from '@utils';

import type { FieldBaseProps } from '@app-types';

type FormInputProps<TFieldValues extends FieldValues> = Omit<InputHTMLAttributes<HTMLInputElement>, 'name'> & FieldBaseProps<TFieldValues>;

function FormInput<TFieldValues extends FieldValues>({
  name,
  label,
  tooltip,
  className,
  containerClassName,
  labelClassName,
  errorClassName,
  required,
  rules,
  ...props
}: FormInputProps<TFieldValues>) {
  const { register } = useFormContext<TFieldValues>();
  const { fieldState } = useController<TFieldValues>({ name });

  const { error } = fieldState;
  const id = `${name}-${useId()}`;

  return (
    <FormControl className={containerClassName}>
      <FormLabel className={labelClassName} htmlFor={id} tooltip={tooltip} required={required} hidden={!label} error={error!}>
        {label}
      </FormLabel>

      <div className="relative">
        <Input
          id={id}
          autoComplete="off"
          className={cn(
            error &&
              'border-destructive hover:not-disabled:border-destructive hover:not-disabled:ring-destructive focus-visible:border-destructive focus-visible:ring-destructive placeholder:text-destructive ps-8',
            className,
          )}
          {...register(name, rules)}
          {...props}
        />

        <FormMessage className={errorClassName} hidden={!error} error={error!} />
      </div>
    </FormControl>
  );
}

export default FormInput;
