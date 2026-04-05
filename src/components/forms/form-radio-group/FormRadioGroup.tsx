import { type ComponentPropsWithoutRef } from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { RadioGroup } from '@components/ui';
import { FormControl, FormLabel, FormMessage } from '@components/forms';

import { cn } from '@utils';

import { Check } from 'lucide-react';

import type { ControlledFieldBaseProps, FormSelectOption, ResolvedOption } from '@app-types';

type FormRadioGroupProps<TFieldValues extends FieldValues, TOption = FormSelectOption> = ControlledFieldBaseProps<
  TFieldValues,
  ComponentPropsWithoutRef<typeof RadioGroup>
> & {
  options: TOption[];
  radioItemClassName?: string;
  getOptionLabel(option: ResolvedOption<TOption>): string;
  getOptionValue(option: ResolvedOption<TOption>): string;
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
  disabled,
  options,
  getOptionLabel,
  getOptionValue,
  radioItemClassName,
  ...props
}: FormRadioGroupProps<TFieldValues, TOption>) {
  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <FormControl className={cn(containerClassName)}>
          <FormLabel className={labelClassName} hidden={!label} error={error!} htmlFor={name} required={required}>
            {label}
          </FormLabel>

          <RadioGroup
            className={cn('relative flex flex-wrap gap-3 md:gap-6', className)}
            value={field.value ?? ''}
            disabled={field.disabled || disabled}
            onValueChange={field.onChange}
            {...props}
          >
            {options.map((option) => (
              <RadioGroup.Item
                key={getOptionValue(option)}
                id={name}
                ref={field.ref}
                className={cn(
                  'flex-1 shrink-0',
                  error &&
                    'border-destructive hover:border-destructive hover:ring-destructive focus-visible:border-destructive focus-visible:ring-destructive text-destructive',
                  radioItemClassName,
                )}
                value={getOptionValue(option)}
              >
                <span className="flex flex-1 items-center text-sm font-normal">{getOptionLabel(option)}</span>

                <RadioGroup.Indicator
                  className={cn(
                    error &&
                      'border-destructive data-[state=checked]:bg-destructive data-[state=checked]:border-destructive group-hover/radio-item:border-destructive group-hover/radio-item:ring-destructive',
                  )}
                >
                  <Check size={16} stroke="white" className="hidden group-data-[state=checked]/radio-item:block" />
                </RadioGroup.Indicator>
              </RadioGroup.Item>
            ))}

            <FormMessage className={cn('inset-s-auto inset-e-9 inset-bs-6', errorClassName)} hidden={!error} error={error!} />
          </RadioGroup>
        </FormControl>
      )}
    />
  );
}

FormRadioGroup.displayName = 'FormRadioGroup';

export default FormRadioGroup;
