import { Controller, type FieldValues } from 'react-hook-form';

import { FormControl, FormLabel, FormMessage } from '@components/forms';
import { Combobox, type ComboboxProps } from '@components/shared';

import { cn } from '@utils';

import type { ControlledFieldBaseProps, FormSelectOption } from '@app-types';

type FormComboboxProps<TFieldValues extends FieldValues, TOption = FormSelectOption> = ControlledFieldBaseProps<
  TFieldValues,
  Omit<ComboboxProps<TOption>, 'value' | 'defaultValue' | 'onChange' | 'onOptionChange' | 'id' | 'queryKey' | 'disabled' | 'children'>
> & {
  disabled?: boolean;
};

function FormCombobox<TFieldValues extends FieldValues, TOption = FormSelectOption>({
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
  ...comboboxProps
}: FormComboboxProps<TFieldValues, TOption>) {
  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      rules={rules}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const stringValue = (() => {
          if (!value) return null;

          if (comboboxProps.valueType === 'contain') {
            return comboboxProps.getOptionValue(value as TOption);
          }

          return value as string | null;
        })();

        const handleChange = (newValue: string | null) => {
          if (comboboxProps.valueType === 'flat' || comboboxProps.valueType === undefined) {
            onChange(newValue);
          }
        };

        const handleOptionChange = (option: TOption | null) => {
          if (comboboxProps.valueType === 'contain') {
            onChange(option);
          }
        };

        const handleClear = () => {
          if (comboboxProps.valueType === 'contain') {
            onChange(null);
          } else {
            onChange(null);
          }
        };

        return (
          <FormControl className={containerClassName}>
            <FormLabel className={labelClassName} hidden={!label} error={error!} htmlFor={name} required={required}>
              {label}
            </FormLabel>

            <div className="relative">
              <Combobox
                {...comboboxProps}
                id={name}
                value={stringValue}
                onChange={handleChange}
                onOptionChange={comboboxProps.valueType === 'contain' ? handleOptionChange : undefined}
                disabled={disabled}
                queryKey={name}
              >
                <Combobox.Trigger
                  className={cn(
                    error &&
                      'border-destructive hover:ring-destructive focus-within:ring-destructive border bg-transparent ps-8 focus-within:ring hover:bg-transparent hover:ring',
                    className,
                  )}
                >
                  <Combobox.Clear onClear={handleClear} hasValue={!!stringValue && stringValue !== ''} />
                </Combobox.Trigger>

                <Combobox.Content />
              </Combobox>

              <FormMessage className={errorClassName} hidden={!error} error={error!} />
            </div>
          </FormControl>
        );
      }}
    />
  );
}

FormCombobox.displayName = 'FormCombobox';

export default FormCombobox;
