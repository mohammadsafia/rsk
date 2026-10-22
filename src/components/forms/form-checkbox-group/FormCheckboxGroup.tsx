'use client';

import { type ComponentPropsWithoutRef, useId } from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { CheckboxGroup } from '@components/ui';
import { FormField } from '@components/forms';

import { cn } from '@utils';

import { Check } from 'lucide-react';

import type { ControlledFieldBaseProps, FormSelectOption, ResolvedOption } from '@app-types';

type FormCheckboxGroupProps<TFieldValues extends FieldValues, TOption = FormSelectOption> = ControlledFieldBaseProps<
  TFieldValues,
  ComponentPropsWithoutRef<typeof CheckboxGroup>
> & {
  options: TOption[];
  getOptionLabel(option: ResolvedOption<TOption>): string;
  getOptionValue(option: ResolvedOption<TOption>): string;
};

function FormCheckboxGroup<TFieldValues extends FieldValues, TOption = FormSelectOption>({
  name,
  rules,
  control,
  label,
  description,
  tooltip,
  className,
  required,
  disabled,
  options,
  getOptionLabel,
  getOptionValue,
  ...props
}: FormCheckboxGroupProps<TFieldValues, TOption>) {
  // Unique per instance: two forms on one page may share a field name.
  const fieldId = `${name}-${useId()}`;

  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => {
        const selectedValues: string[] = Array.isArray(field.value) ? field.value : [];

        const handleCheckedChange = (optionValue: string, checked: boolean) => {
          field.onChange(checked ? [...selectedValues, optionValue] : selectedValues.filter((value) => value !== optionValue));
        };

        return (
          <FormField id={fieldId} label={label} description={description} tooltip={tooltip} required={required} error={error}>
            {({ 'aria-required': _required, ...fieldControl }) => (
              // aria-required isn't allowed on role="group"; the label's required marker carries it.
              <CheckboxGroup {...fieldControl} className={cn('flex flex-wrap gap-x-6 gap-y-2', className)} {...props}>
                {options.map((option, index) => {
                  const value = getOptionValue(option);

                  return (
                    <CheckboxGroup.Item
                      key={value}
                      ref={index === 0 ? field.ref : undefined}
                      checked={selectedValues.includes(value)}
                      disabled={field.disabled || disabled}
                      onCheckedChange={(checked) => handleCheckedChange(value, !!checked)}
                    >
                      <CheckboxGroup.Indicator>
                        <Check className="hidden size-3 group-data-[state=checked]/checkbox-item:block" strokeWidth={3} />
                      </CheckboxGroup.Indicator>

                      <span>{getOptionLabel(option)}</span>
                    </CheckboxGroup.Item>
                  );
                })}
              </CheckboxGroup>
            )}
          </FormField>
        );
      }}
    />
  );
}

FormCheckboxGroup.displayName = 'FormCheckboxGroup';

export default FormCheckboxGroup;
