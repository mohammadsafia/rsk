import { type InputHTMLAttributes, useId } from 'react';
import { type FieldValues, useController, useFormContext } from 'react-hook-form';

import { FormControl, FormLabel, FormMessage } from '@components/forms';
import { Input } from '@components/ui';

import { cn } from '@utils';

import type { FieldBaseProps } from '@app-types';

type FormInputProps<TFieldValues extends FieldValues> = Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'size'> &
  FieldBaseProps<TFieldValues>;

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
          invalid={!!error}
          className={cn(error && 'ps-8', className)}
          {...register(name, rules)}
          {...props}
        />

        <FormMessage className={errorClassName} hidden={!error} error={error!} />
      </div>
    </FormControl>
  );
}

export default FormInput;
