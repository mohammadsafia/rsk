import { Controller, type FieldValues } from 'react-hook-form';

import { FormControl, FormLabel, FormMessage } from '@components/forms';
import { TimePicker, type TimePickerProps } from '@components/ui';

import { cn } from '@utils';

import type { ControlledFieldBaseProps } from '@app-types';

type FormTimePickerProps<TFieldValues extends FieldValues> = Omit<ControlledFieldBaseProps<TFieldValues>, 'onChange' | 'value'> &
  Omit<TimePickerProps, 'name' | 'value' | 'onChange' | 'error'>;

function FormTimePicker<TFieldValues extends FieldValues>({
  name,
  rules,
  control,
  label,
  containerClassName,
  labelClassName,
  className,
  errorClassName,
  required,
  ...props
}: FormTimePickerProps<TFieldValues>) {
  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const timeValue: string | null | undefined =
          typeof value === 'string' ? value : value === null || value === undefined ? undefined : String(value);

        const handleChange = (newValue?: string) => {
          onChange(newValue ?? null);
        };

        return (
          <FormControl className={containerClassName}>
            <FormLabel className={labelClassName} hidden={!label} error={error!} htmlFor={name} required={required}>
              {label}
            </FormLabel>

            <div className="relative">
              <TimePicker
                name={name}
                value={timeValue}
                onChange={handleChange}
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
