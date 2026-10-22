'use client';

import { type ComponentPropsWithoutRef, useId } from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { RadioGroup } from '@components/ui';
import { FormField } from '@components/forms';

import { cn } from '@utils';

import type { ControlledFieldBaseProps, FormSelectOption, ResolvedOption } from '@app-types';

type FormRadioGroupProps<TFieldValues extends FieldValues, TOption = FormSelectOption> = ControlledFieldBaseProps<
  TFieldValues,
  ComponentPropsWithoutRef<typeof RadioGroup>
> & {
  options: TOption[];
  getOptionLabel(option: ResolvedOption<TOption>): string;
  getOptionValue(option: ResolvedOption<TOption>): string;
};

function FormRadioGroup<TFieldValues extends FieldValues, TOption = FormSelectOption>({
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
}: FormRadioGroupProps<TFieldValues, TOption>) {
  // Unique per instance: two forms on one page may share a field name.
  const fieldId = `${name}-${useId()}`;

  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <FormField id={fieldId} label={label} description={description} tooltip={tooltip} required={required} error={error}>
          {(fieldControl) => (
            <RadioGroup
              {...fieldControl}
              className={cn('flex flex-wrap gap-x-6 gap-y-2', className)}
              value={field.value ?? ''}
              disabled={field.disabled || disabled}
              onValueChange={field.onChange}
              {...props}
            >
              {options.map((option, index) => {
                const value = getOptionValue(option);

                return (
                  <RadioGroup.Item key={value} id={`${fieldControl.id}-${value}`} ref={index === 0 ? field.ref : undefined} value={value}>
                    <RadioGroup.Indicator />

                    <span>{getOptionLabel(option)}</span>
                  </RadioGroup.Item>
                );
              })}
            </RadioGroup>
          )}
        </FormField>
      )}
    />
  );
}

FormRadioGroup.displayName = 'FormRadioGroup';

export default FormRadioGroup;
