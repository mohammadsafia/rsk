import { type ComponentPropsWithoutRef } from 'react';
import { Controller, type FieldValues } from 'react-hook-form';
import { Square } from 'lucide-react';
import { CheckSquareFilled } from '@assets/icons';

import { FormControl, FormLabel, FormMessage } from '@components/forms';
import { CheckboxGroup } from '@components/ui';

import { cn } from '@utils';

import type { ControlledFieldBaseProps, FormSelectOption } from '@app-types';

type FormCheckboxGroupProps<TFieldValues extends FieldValues, TOption = FormSelectOption> = ControlledFieldBaseProps<
  TFieldValues,
  Omit<ComponentPropsWithoutRef<'div'>, 'defaultValue'>
> & {
  options: TOption[];
  getOptionLabel(option: TOption): string;
  getOptionValue(option: TOption): string;
  checkboxItemClassName?: string;
};

function FormCheckboxGroup<TFieldValues extends FieldValues, TOption = FormSelectOption>({
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
            <FormLabel className={labelClassName} hidden={!label} error={error!} htmlFor={name} required={required}>
              {label}
            </FormLabel>

            <CheckboxGroup className={className} {...props}>
              {options.map((option) => {
                const value = getOptionValue(option);
                return (
                  <CheckboxGroup.Item
                    key={value}
                    checked={selectedValues.includes(value)}
                    onCheckedChange={(checked) => handleCheckedChange(value, !!checked)}
                    disabled={disabled}
                    className={cn(error && 'ring-destructive rounded-xl ring-1', checkboxItemClassName)}
                  >
                    <span className="text-muted group-data-[state=checked]/checkbox-item:text-primary-900 group-disabled/checkbox-item:text-muted-300 flex flex-1 items-center text-sm font-normal">
                      {getOptionLabel(option)}
                    </span>
                    <CheckboxGroup.Indicator>
                      <CheckSquareFilled className="text-secondary group-disabled/checkbox-item:text-muted-400 hidden group-data-[state=checked]/checkbox-item:block" />
                      <Square
                        size={24}
                        strokeWidth={1.5}
                        className="text-muted-300 block rounded group-data-[state=checked]/checkbox-item:hidden"
                      />
                    </CheckboxGroup.Indicator>
                  </CheckboxGroup.Item>
                );
              })}
            </CheckboxGroup>

            <FormMessage className={errorClassName} hidden={!error} error={error!} />
          </FormControl>
        );
      }}
    />
  );
}

FormCheckboxGroup.displayName = 'FormCheckboxGroup';

export default FormCheckboxGroup;
