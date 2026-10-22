'use client';

import { useId } from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { FormField } from '@components/forms';
import { FormattedNumber, type FormattedNumberProps } from '@components/ui';

import type { ControlledFieldBaseProps } from '@app-types';

type FormNumberProps<TFieldValues extends FieldValues> = ControlledFieldBaseProps<TFieldValues, FormattedNumberProps>;

function FormNumber<TFieldValues extends FieldValues>({
  name,
  rules,
  control,
  label,
  description,
  tooltip,
  className,
  required,
  ...props
}: FormNumberProps<TFieldValues>) {
  const id = useId();

  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <FormField id={`${id}-${name}`} label={label} description={description} tooltip={tooltip} required={required} error={error}>
          {(fieldControl) => <FormattedNumber className={className} {...fieldControl} {...field} {...props} />}
        </FormField>
      )}
    />
  );
}

FormNumber.displayName = 'FormNumber';

export default FormNumber;
