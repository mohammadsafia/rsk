import { type ComponentPropsWithoutRef } from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { CheckboxGroup } from '@components/ui';
import { FormControl, FormLabel, FormMessage } from '@components/forms';

import { cn } from '@utils';

import { Check } from 'lucide-react';

import type { ControlledFieldBaseProps, FormSelectOption, ResolvedOption } from '@app-types';

type FormCheckboxGroupProps<TFieldValues extends FieldValues, TOption = FormSelectOption> = ControlledFieldBaseProps<
  TFieldValues,
  ComponentPropsWithoutRef<typeof CheckboxGroup>
> & {
  options: TOption[];
  checkboxItemClassName?: string;
  getOptionLabel(option: ResolvedOption<TOption>): string;
  getOptionValue(option: ResolvedOption<TOption>): string;
};

function FormCheckboxGroup<TFieldValues extends FieldValues, TOption = FormSelectOption>({
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
  disabled,
  options,
  getOptionLabel,
  getOptionValue,
  checkboxItemClassName,
  ...props
}: FormCheckboxGroupProps<TFieldValues, TOption>) {
  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => {
        const selectedValues: string[] = Array.isArray(field.value) ? field.value : [];

        const handleCheckedChange = (optionValue: string, checked: boolean) => {
          const updated = checked ? [...selectedValues, optionValue] : selectedValues.filter((v) => v !== optionValue);
          field.onChange(updated);
        };

        return (
          <FormControl className={containerClassName}>
            <FormLabel className={labelClassName} htmlFor={name} tooltip={tooltip} required={required} hidden={!label} error={error!}>
              {label}
            </FormLabel>

            <CheckboxGroup className={cn('relative flex flex-wrap gap-3 md:gap-6', className)} {...props}>
              {options.map((option) => {
                const value = getOptionValue(option);

                return (
                  <CheckboxGroup.Item
                    key={value}
                    ref={field.ref}
                    className={cn(
                      'flex-1 shrink-0',
                      error &&
                        'border-destructive hover:border-destructive hover:ring-destructive focus-visible:border-destructive focus-visible:ring-destructive text-destructive',
                      checkboxItemClassName,
                    )}
                    checked={selectedValues.includes(value)}
                    disabled={field.disabled || disabled}
                    onCheckedChange={(checked) => handleCheckedChange(value, !!checked)}
                  >
                    <span className="flex flex-1 items-center text-sm font-normal">{getOptionLabel(option)}</span>

                    <CheckboxGroup.Indicator
                      className={cn(
                        error &&
                          'border-destructive data-[state=checked]:bg-destructive data-[state=checked]:border-destructive group-hover/checkbox-item:border-destructive group-hover/checkbox-item:ring-destructive',
                      )}
                    >
                      <Check size={16} stroke="white" className="hidden group-data-[state=checked]/checkbox-item:block" />
                    </CheckboxGroup.Indicator>
                  </CheckboxGroup.Item>
                );
              })}

              <FormMessage className={cn('inset-s-auto inset-e-9 inset-bs-6', errorClassName)} hidden={!error} error={error!} />
            </CheckboxGroup>
          </FormControl>
        );
      }}
    />
  );
}

FormCheckboxGroup.displayName = 'FormCheckboxGroup';

export default FormCheckboxGroup;
