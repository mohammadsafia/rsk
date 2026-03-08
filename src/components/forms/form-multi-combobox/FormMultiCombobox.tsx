import { Controller, type FieldValues } from 'react-hook-form';

import { FormControl, FormLabel, FormMessage } from '@components/forms';
import { MultiCombobox, type MultiComboboxProps } from '@components/shared';

import { cn } from '@utils';

import type { ControlledFieldBaseProps, FormSelectOption } from '@app-types';

type FormMultiComboboxProps<TFieldValues extends FieldValues, TOption = FormSelectOption> = ControlledFieldBaseProps<
  TFieldValues,
  Omit<MultiComboboxProps<TOption>, 'value' | 'defaultValue' | 'onChange' | 'onOptionChange' | 'id' | 'queryKey' | 'disabled' | 'children'>
> & {
  disabled?: boolean;
};

function FormMultiCombobox<TFieldValues extends FieldValues, TOption = FormSelectOption>({
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
  ...multiComboboxProps
}: FormMultiComboboxProps<TFieldValues, TOption>) {
  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      rules={rules}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const stringArrayValue = (() => {
          if (!value || !Array.isArray(value)) return [];

          if (multiComboboxProps.valueType === 'contain') {
            return value.map((option: TOption) => multiComboboxProps.getOptionValue(option));
          }

          return value as string[];
        })();

        const handleChange = (newValue: string[] | TOption[]) => {
          if (multiComboboxProps.valueType === 'flat' || multiComboboxProps.valueType === undefined) {
            onChange(newValue as string[]);
          }
        };

        const handleOptionChange = (options: TOption[]) => {
          if (multiComboboxProps.valueType === 'contain') {
            onChange(options);
          }
        };

        const handleClear = () => {
          if (multiComboboxProps.valueType === 'contain') {
            onChange([]);
          } else {
            onChange([]);
          }
        };

        return (
          <FormControl className={containerClassName}>
            <FormLabel className={labelClassName} hidden={!label} error={error!} htmlFor={name} required={required}>
              {label}
            </FormLabel>

            <div className="relative">
              <MultiCombobox
                {...multiComboboxProps}
                id={name}
                value={stringArrayValue}
                onChange={handleChange}
                onOptionChange={multiComboboxProps.valueType === 'contain' ? handleOptionChange : undefined}
                disabled={disabled}
                queryKey={name}
              >
                <MultiCombobox.Trigger
                  className={cn(
                    error &&
                      'border-destructive hover:ring-destructive focus-within:ring-destructive border bg-transparent ps-8 focus-within:ring hover:bg-transparent hover:ring',
                    className,
                  )}
                >
                  <MultiCombobox.Clear onClear={handleClear} hasValue={stringArrayValue.length > 0} />
                </MultiCombobox.Trigger>

                <MultiCombobox.Content />
              </MultiCombobox>

              <FormMessage className={errorClassName} hidden={!error} error={error!} />
            </div>
          </FormControl>
        );
      }}
    />
  );
}

FormMultiCombobox.displayName = 'FormMultiCombobox';

export default FormMultiCombobox;
