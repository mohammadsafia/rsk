import { type ComponentPropsWithoutRef, Fragment } from 'react';
import { Controller, type FieldValues } from 'react-hook-form';

import { Select } from '@components/ui';
import { Conditional } from '@components/utils';
import { TooltipButton } from '@components/shared';
import { FormControl, FormLabel, FormMessage } from '@components/forms';

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
  getOptionLabel(option: ResolvedOption<TOption>): string;
  getOptionValue(option: ResolvedOption<TOption>): string;
  optionMapper?(option: ResolvedOption<TOption>): ResolvedOption<TOption>;
};

function FormSelect<TFieldValues extends FieldValues, TOption = FormSelectOption>({
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
  placeholder = 'Select',
  noOptionsText = 'No Options',
  valueType = 'flat',
  getOptionLabel,
  getOptionValue,
  optionMapper,
  ...props
}: FormSelectProps<TFieldValues, TOption>) {
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
          onChange(valueType === 'contain' ? null : '');
        };

        return (
          <FormControl className={containerClassName}>
            <FormLabel className={labelClassName} hidden={!label} error={error!} htmlFor={name} required={required}>
              {label}
            </FormLabel>

            <div className="relative">
              <Select value={internalValue ?? ''} onValueChange={onValueChange} {...field} {...props}>
                <Select.Trigger
                  ref={ref}
                  id={name}
                  className={cn(
                    !!error &&
                      'border-destructive hover:not-disabled:border-destructive hover:not-disabled:ring-destructive focus-visible:border-destructive focus-visible:ring-destructive text-destructive ps-8',
                    className,
                  )}
                  disabled={field.disabled || props.disabled}
                >
                  <Select.Value placeholder={placeholder} />

                  <Conditional.If condition={!!internalValue && !field.disabled && !props.disabled}>
                    <TooltipButton
                      asChild
                      title="Clear"
                      variant="ghost-muted-destructive"
                      size="unstyled"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onClear();
                      }}
                    >
                      <XIcon size={16} />
                    </TooltipButton>
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

              <FormMessage className={errorClassName} hidden={!error} error={error!} />
            </div>
          </FormControl>
        );
      }}
    />
  );
}

FormSelect.displayName = 'FormSelect';

export default FormSelect;
