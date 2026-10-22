'use client';

import { useId } from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { FormField } from '@components/forms';
import { TimePicker, type TimePickerProps } from '@components/ui';

import { type TimeFormat, useDate } from '@hooks/shared';

import type { ControlledFieldBaseProps } from '@app-types';

type FormTimePickerProps<TFieldValues extends FieldValues> = Omit<ControlledFieldBaseProps<TFieldValues>, 'onChange' | 'value'> &
  Omit<TimePickerProps, 'name' | 'value' | 'onChange'> & {
    valueFormat?: TimeFormat;
  };

function FormTimePicker<TFieldValues extends FieldValues>({
  name,
  rules,
  control,
  label,
  description,
  tooltip,
  className,
  required,
  valueFormat,
  use24hFormat,
  ...props
}: FormTimePickerProps<TFieldValues>) {
  // Unique per instance: two forms on one page may share a field name.
  const fieldId = `${name}-${useId()}`;

  const { toFormat, constants } = useDate();

  const displayFormat = use24hFormat ? constants.TimeFormats.HOUR_MINUTES_24 : constants.TimeFormats.HOUR_MINUTES_12;

  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const storedString = typeof value === 'string' ? value : value === null || value === undefined ? undefined : String(value);

        const timeValue = valueFormat && storedString ? toFormat(storedString, valueFormat, displayFormat) : storedString;

        const handleChange = (newValue?: string) => {
          if (!newValue) {
            onChange(null);
            return;
          }

          const out = valueFormat ? toFormat(newValue, displayFormat, valueFormat) : newValue;
          onChange(out || null);
        };

        return (
          <FormField id={fieldId} label={label} description={description} tooltip={tooltip} required={required} error={error}>
            {(fieldControl) => (
              <TimePicker
                name={name}
                id={fieldControl.id}
                invalid={fieldControl.invalid}
                aria-describedby={fieldControl['aria-describedby']}
                aria-required={fieldControl['aria-required']}
                value={timeValue}
                onChange={handleChange}
                use24hFormat={use24hFormat}
                className={className}
                {...props}
              />
            )}
          </FormField>
        );
      }}
    />
  );
}

FormTimePicker.displayName = 'FormTimePicker';

export default FormTimePicker;
