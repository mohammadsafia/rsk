import { type ComponentPropsWithoutRef } from 'react';
import { Controller, type FieldValues } from 'react-hook-form';
import { Circle } from 'lucide-react';
import { CheckCircleFilled } from '@assets/icons';

import { FormControl, FormLabel, FormMessage } from '@components/forms';
import { RadioGroup } from '@components/ui';

import { cn } from '@utils';

import type { ControlledFieldBaseProps, FormSelectOption } from '@app-types';

type FormRadioGroupProps<TFieldValues extends FieldValues, TOption = FormSelectOption> = ControlledFieldBaseProps<
  TFieldValues,
  ComponentPropsWithoutRef<typeof RadioGroup>
> & {
  options: TOption[];
  getOptionLabel(option: TOption): string;
  getOptionValue(option: TOption): string;
  radioItemClassName?: string;
};

function FormRadioGroup<TFieldValues extends FieldValues, TOption = FormSelectOption>({
  name,
  rules,
  control,
  label,
  containerClassName,
  labelClassName,
  className,
  errorClassName,
  required,
  options,
  getOptionLabel,
  getOptionValue,
  disabled,
  radioItemClassName,
  ...props
}: FormRadioGroupProps<TFieldValues, TOption>) {
  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <FormControl className={containerClassName}>
          <FormLabel className={labelClassName} hidden={!label} error={error!} htmlFor={name} required={required}>
            {label}
          </FormLabel>

          <RadioGroup value={field.value ?? ''} onValueChange={field.onChange} disabled={disabled} className={cn(className)} {...props}>
            {options.map((option) => (
              <RadioGroup.Item
                className={cn(error && 'ring-destructive rounded-xl ring-1', radioItemClassName)}
                key={getOptionValue(option)}
                value={getOptionValue(option)}
              >
                <span className="text-muted group-data-[state=checked]/radio-item:text-primary-900 group-disabled/radio-item:text-muted-300 flex flex-1 items-center text-sm font-normal">
                  {getOptionLabel(option)}
                </span>
                <RadioGroup.Indicator>
                  <CheckCircleFilled className="text-secondary group-disabled/radio-item:text-muted-400 hidden group-data-[state=checked]/radio-item:block" />
                  <Circle size={24} strokeWidth={1.5} className="text-muted-300 block group-data-[state=checked]/radio-item:hidden" />
                </RadioGroup.Indicator>
              </RadioGroup.Item>
            ))}
          </RadioGroup>

          <FormMessage className={errorClassName} hidden={!error} error={error!} />
        </FormControl>
      )}
    />
  );
}

FormRadioGroup.displayName = 'FormRadioGroup';

export default FormRadioGroup;
