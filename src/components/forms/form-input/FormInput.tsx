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
  className,
  containerClassName,
  labelClassName,
  errorClassName,
  required,
  ...props
}: FormInputProps<TFieldValues>) {
  const { register } = useFormContext<TFieldValues>();
  const { fieldState } = useController<TFieldValues>({ name });

  const { error } = fieldState;
  const id = `${name}-${useId()}`;

  return (
    <FormControl className={containerClassName}>
      <FormLabel className={labelClassName} hidden={!label} error={error!} htmlFor={id} required={required}>
        {label}
      </FormLabel>
      <div className="relative">
        <Input
          id={id}
          autoComplete="off"
          className={cn(
            error &&
              'border-destructive hover:ring-destructive focus-visible:ring-destructive focus-visible:border-destructive ps-8 focus-visible:ring-1',
            className,
          )}
          {...register(name)}
          {...props}
        />

        <FormMessage className={errorClassName} hidden={!error} error={error!} />
      </div>
    </FormControl>
  );
}

export default FormInput;
