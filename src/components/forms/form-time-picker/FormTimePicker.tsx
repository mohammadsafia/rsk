import { Controller, type FieldValues } from 'react-hook-form';

import { FormControl, FormLabel, FormMessage } from '@components/forms';
import { TimePicker, type TimePickerProps } from '@components/ui';

import { type TimeFormat, useDate } from '@hooks/shared';
import { cn } from '@utils';

import type { ControlledFieldBaseProps } from '@app-types';

type FormTimePickerProps<TFieldValues extends FieldValues> = Omit<ControlledFieldBaseProps<TFieldValues>, 'onChange' | 'value'> &
  Omit<TimePickerProps, 'name' | 'value' | 'onChange' | 'error'> & {
    valueFormat?: TimeFormat;
  };

function FormTimePicker<TFieldValues extends FieldValues>({
  name,
  rules,
  control,
  label,
  tooltip,
  containerClassName,
  labelClassName,
  className,
  errorClassName,
  required,
  valueFormat,
  use24hFormat,
  ...props
}: FormTimePickerProps<TFieldValues>) {
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
          <FormControl className={containerClassName}>
            <FormLabel className={labelClassName} htmlFor={name} tooltip={tooltip} required={required} hidden={!label} error={error!}>
              {label}
            </FormLabel>

            <div className="relative">
              <TimePicker
                name={name}
                value={timeValue}
                onChange={handleChange}
                use24hFormat={use24hFormat}
                className={cn(
                  error &&
                    'border-destructive hover:ring-destructive focus-visible:ring-destructive focus-visible:border-destructive ps-8 focus-visible:ring-1',
                  className,
                )}
                error={!!error}
                {...props}
              />

              <FormMessage className={errorClassName} hidden={!error} error={error!} />
            </div>
          </FormControl>
        );
      }}
    />
  );
}

FormTimePicker.displayName = 'FormTimePicker';

export default FormTimePicker;
