import { type ComponentPropsWithoutRef, Fragment, useId } from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { Select } from '@components/ui';
import { Conditional } from '@components/utils';
import { FormField } from '@components/forms';

import { cn } from '@utils';

import { XIcon } from 'lucide-react';

import type { ControlledFieldBaseProps, FormSelectOption, ResolvedOption } from '@app-types';

type FormSelectProps<TFieldValues extends FieldValues, TOption = FormSelectOption> = ControlledFieldBaseProps<
  TFieldValues,
  ComponentPropsWithoutRef<typeof Select>
> & {
  className?: string;
  options: TOption[];
  placeholder?: string;
  valueType?: 'flat' | 'contain';
  noOptionsText?: string;
  clearable?: boolean;
  getOptionLabel(option: ResolvedOption<TOption>): string;
  getOptionValue(option: ResolvedOption<TOption>): string;
  optionMapper?(option: ResolvedOption<TOption>): ResolvedOption<TOption>;
};

function FormSelect<TFieldValues extends FieldValues, TOption = FormSelectOption>({
  name,
  rules,
  control,
  label,
  description,
  tooltip,
  className,
  required,
  options,
  placeholder = 'Select',
  noOptionsText = 'No Options',
  valueType = 'flat',
  clearable = true,
  getOptionLabel,
  getOptionValue,
  optionMapper,
  ...props
}: FormSelectProps<TFieldValues, TOption>) {
  // Unique per instance: two forms on one page may share a field name.
  const fieldId = `${name}-${useId()}`;

  const mappedOptions = options.map((option) => (optionMapper ? optionMapper(option) : option));

  const findOptionByValue = (value: string): TOption | undefined => {
    return options.find((option) => getOptionValue(option) === value);
  };

  return (
    <Controller<TFieldValues>
      name={name}
      control={control}
      rules={rules}
      render={({ field: { ref, value, onChange, ...field }, fieldState: { error } }) => {
        const internalValue = valueType === 'contain' && value !== null ? getOptionValue(value as TOption) : value;

        const onValueChange = (selectedValue: string) => {
          onChange(valueType === 'contain' ? findOptionByValue(selectedValue) : selectedValue);
        };

        const onClear = () => {
          onChange(null);
        };

        return (
          <FormField id={fieldId} label={label} description={description} tooltip={tooltip} required={required} error={error}>
            {(fieldControl) => (
              <Select value={internalValue ?? ''} onValueChange={onValueChange} {...field} {...props}>
                <Select.Trigger ref={ref} {...fieldControl} className={className} disabled={field.disabled || props.disabled}>
                  <Select.Value placeholder={placeholder} />

                  <Conditional.If condition={!!internalValue && !field.disabled && !props.disabled && clearable}>
                    <XIcon
                      size={16}
                      role="button"
                      aria-label="Clear"
                      className="text-fg-muted hover:text-danger shrink-0 cursor-pointer"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onClear();
                      }}
                    />
                  </Conditional.If>

                  <Select.Icon />
                </Select.Trigger>

                <Select.Content position="popper">
                  <Select.Item className={cn(mappedOptions.length > 0 && 'hidden')} aria-hidden="true" value="none" disabled>
                    <Select.Text>{noOptionsText}</Select.Text>
                  </Select.Item>

                  {mappedOptions.map((option) => (
                    <Fragment key={getOptionValue(option)}>
                      <Select.Item value={getOptionValue(option)}>
                        <Select.Text>{getOptionLabel(option)}</Select.Text>
                      </Select.Item>
                    </Fragment>
                  ))}
                </Select.Content>
              </Select>
            )}
          </FormField>
        );
      }}
    />
  );
}

FormSelect.displayName = 'FormSelect';

export default FormSelect;
