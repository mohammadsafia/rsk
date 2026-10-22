'use client';

import { type TextareaHTMLAttributes, useId } from 'react';
import { type FieldValues, useController, useFormContext } from 'react-hook-form';

import { FormField } from '@components/forms';
import { Textarea } from '@components/ui';

import type { FieldBaseProps } from '@app-types';

type FormTextareaProps<TFieldValues extends FieldValues> = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldBaseProps<TFieldValues>;

function FormTextarea<TFieldValues extends FieldValues>({
  name,
  label,
  description,
  tooltip,
  className,
  required,
  rules,
  ...props
}: FormTextareaProps<TFieldValues>) {
  const { register } = useFormContext<TFieldValues>();
  const {
    fieldState: { error },
  } = useController<TFieldValues>({ name });

  const id = `${name}-${useId()}`;

  return (
    <FormField id={id} label={label} description={description} tooltip={tooltip} required={required} error={error}>
      {(control) => <Textarea className={className} {...control} {...register(name, rules)} {...props} />}
    </FormField>
  );
}

export default FormTextarea;
