'use client';

import { type ReactElement, useId } from 'react';
import { type FieldValues, useController } from 'react-hook-form';

import { ChipInput, type ChipInputProps } from '@components/ui';

import { FormField } from '@components/forms';

import type { FieldBaseProps } from '@app-types';

type FormChipInputProps<TFieldValues extends FieldValues> = Omit<ChipInputProps, 'value' | 'onChange' | 'name' | 'invalid'> &
  FieldBaseProps<TFieldValues>;

/** ChipInput as a form field: its value is the list of chips (string[]); the label also names the list of chips. */
function FormChipInput<TFieldValues extends FieldValues>({
  name,
  label,
  description,
  tooltip,
  required,
  rules,
  listLabel,
  ...props
}: FormChipInputProps<TFieldValues>): ReactElement {
  const { field, fieldState } = useController<TFieldValues>({ name, rules });

  const id = `${name}-${useId()}`;

  return (
    <FormField id={id} label={label} description={description} tooltip={tooltip} required={required} error={fieldState.error}>
      {(control) => (
        <ChipInput
          {...control}
          {...props}
          ref={field.ref}
          name={field.name}
          value={(field.value as string[] | undefined) ?? []}
          listLabel={listLabel ?? (typeof label === 'string' ? label : undefined)}
          onChange={field.onChange}
          onBlur={field.onBlur}
        />
      )}
    </FormField>
  );
}

export default FormChipInput;
