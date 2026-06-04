import { useId } from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { FormControl, FormLabel, FormMessage } from '@components/forms';
import { FormattedNumber, type FormattedNumberProps } from '@components/ui';

import { cn } from '@utils';

import type { ControlledFieldBaseProps } from '@app-types';

type FormNumberProps<TFieldValues extends FieldValues> = ControlledFieldBaseProps<TFieldValues, FormattedNumberProps>;

function FormNumber<TFieldValues extends FieldValues>({
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
  ...props
}: FormNumberProps<TFieldValues>) {
  const id = useId();

  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => {
        return (
          <FormControl className={containerClassName}>
            <FormLabel
              className={labelClassName}
              htmlFor={`${id}-${name}`}
              tooltip={tooltip}
              required={required}
              hidden={!label}
              error={error!}
            >
              {label}
            </FormLabel>

            <div className="relative">
              <FormattedNumber
                id={`${id}-${name}`}
                className={cn(
                  error &&
                    'border-destructive hover:not-disabled:border-destructive hover:not-disabled:ring-destructive focus-visible:border-destructive focus-visible:ring-destructive placeholder:text-destructive ps-8',
                  className,
                )}
                {...field}
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

FormNumber.displayName = 'FormNumber';

export default FormNumber;
