'use client';

import { type InputHTMLAttributes, useId } from 'react';
import { type FieldValues, useController, useFormContext } from 'react-hook-form';

import { FormField } from '@components/forms';
import { Input } from '@components/ui';

import type { FieldBaseProps } from '@app-types';

type FormInputProps<TFieldValues extends FieldValues> = Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'size'> &
  FieldBaseProps<TFieldValues>;

function FormInput<TFieldValues extends FieldValues>({
  name,
  label,
  description,
  tooltip,
  className,
  required,
  rules,
  ...props
}: FormInputProps<TFieldValues>) {
  const { register } = useFormContext<TFieldValues>();
  const {
    fieldState: { error },
  } = useController<TFieldValues>({ name });

  const id = `${name}-${useId()}`;

  return (
    <FormField id={id} label={label} description={description} tooltip={tooltip} required={required} error={error}>
      {(control) => <Input autoComplete="off" className={className} {...control} {...register(name, rules)} {...props} />}
    </FormField>
  );
}

export default FormInput;
