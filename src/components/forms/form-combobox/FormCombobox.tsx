import { useState } from 'react';

import { type FieldValues, useController } from 'react-hook-form';

import { Combobox } from '@components/shared';
import { FormControl, FormLabel, FormMessage } from '@components/forms';

import { cn } from '@utils';

import { type AsyncOptionsFn, useAsyncOptionsInfiniteQuery, useDebounce, useInfiniteScroll } from '@hooks/shared';

import type { ControlledFieldBaseProps, FormSelectOption, ResolvedOption } from '@app-types';

type FormComboboxOwnProps<TOption> = {
  options: TOption[] | AsyncOptionsFn<TOption>;
  getOptionLabel: (option: TOption) => string;
  getOptionValue: (option: TOption) => string;
  getOptionDisabled?: (option: TOption) => boolean;
  optionMapper?: (option: TOption) => TOption;
  valueType?: 'flat' | 'contain';
  onOptionChange?: (option: TOption | null) => void;
  placeholder?: string;
  noOptionsText?: string;
  disabled?: boolean;
  className?: string;
  urlSearchParams?: URLSearchParams | string;
  debounceMs?: number;
  pageSize?: number;
};

type FormComboboxProps<TFieldValues extends FieldValues, TOption = FormSelectOption> = ControlledFieldBaseProps<
  TFieldValues,
  FormComboboxOwnProps<ResolvedOption<TOption>>
>;

function FormCombobox<TFieldValues extends FieldValues, TOption = FormSelectOption>({
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
  getOptionDisabled,
  optionMapper,
  onOptionChange,
  valueType = 'flat',
  placeholder = 'Select...',
  noOptionsText = 'No options',
  urlSearchParams,
  debounceMs = 500,
  pageSize = 20,
}: FormComboboxProps<TFieldValues, TOption>) {
  const {
    field: { ref, value, onChange, ...field },
    fieldState: { error },
  } = useController<TFieldValues>({ name, control, rules });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, debounceMs);

  const isAsync = typeof options === 'function';

  // Value resolution: flat (string) vs contain (full object)
  const stringValue = (() => {
    if (!value) return null;

    if (valueType === 'contain') return getOptionValue(value as TOption);

    return value as string | null;
  })();

  const selectedItemsIds = stringValue ? [stringValue] : [];
  const hasValueToResolve = valueType === 'flat' && selectedItemsIds.length > 0;

  const infiniteQuery = useAsyncOptionsInfiniteQuery({
    queryKey: `${label}-${name}-combobox-options`,
    fetchOptions: isAsync
      ? (options as AsyncOptionsFn<TOption>)
      : () => Promise.resolve({ data: [] as TOption[], pagination: { page: 1, total: 0, totalPages: 0, pageSize } }),
    searchTerm: debouncedSearch,
    selectedItemsIds,
    urlSearchParams,
    pageSize,
    enabled: isAsync && (open || hasValueToResolve),
  });

  const { handleScroll } = useInfiniteScroll({ infiniteQuery, enabled: isAsync });

  const allOptions = isAsync ? (infiniteQuery.data?.pages.flatMap((p) => p.data) ?? []) : (options as TOption[]);

  const mappedOptions = optionMapper ? allOptions.map(optionMapper) : allOptions;

  // Contain mode: value IS the full object — use directly. Flat mode: resolve from fetched options.
  const selectedOption = (() => {
    if (!stringValue) return undefined;

    if (valueType === 'contain' && value) return value as TOption;

    return allOptions.find((o) => getOptionValue(o) === stringValue);
  })();

  const onSelectChange = (optValue: string) => {
    const option = allOptions.find((o) => getOptionValue(o) === optValue);

    if (!option) return;

    if (stringValue === optValue) {
      onChange(null);
      onOptionChange?.(null);
    } else {
      onChange(valueType === 'contain' ? option : optValue);
      onOptionChange?.(option);
    }

    setOpen(false);
  };

  const onClear = () => {
    onChange(null);
    onOptionChange?.(null);
  };

  return (
    <FormControl className={containerClassName}>
      <FormLabel className={labelClassName} htmlFor={name} tooltip={tooltip} required={required} hidden={!label} error={error!}>
        {label}
      </FormLabel>

      <div className="relative">
        <Combobox open={open} onOpenChange={setOpen}>
          <Combobox.Trigger
            ref={ref}
            id={name}
            className={cn(
              error &&
                'border-destructive hover:not-disabled:border-destructive hover:not-disabled:ring-destructive focus-visible:border-destructive focus-visible:ring-destructive text-destructive ps-8',
              className,
            )}
            disabled={field.disabled || disabled}
            onBlur={field.onBlur}
          >
            <Combobox.Value className="truncate" placeholder={placeholder}>
              {selectedOption ? getOptionLabel(selectedOption) : undefined}
            </Combobox.Value>

            <Combobox.Clear when={!!stringValue && !field.disabled && !disabled} onClear={onClear} />

            <Combobox.Icon />
          </Combobox.Trigger>

          <Combobox.Content shouldFilter={!isAsync}>
            <Combobox.Input placeholder={placeholder} {...(isAsync && { value: search, onValueChange: setSearch })}>
              <Combobox.Loader when={isAsync && (infiniteQuery.isFetching || search !== debouncedSearch)} />
            </Combobox.Input>

            <Combobox.List onScroll={isAsync ? handleScroll : undefined}>
              <Combobox.Empty
                when={(!isAsync && mappedOptions.length === 0) || (isAsync && !infiniteQuery.isFetching && mappedOptions.length === 0)}
              >
                {noOptionsText}
              </Combobox.Empty>

              {mappedOptions.map((option) => {
                const optValue = getOptionValue(option);
                const isChecked = stringValue === optValue;

                return (
                  <Combobox.Item
                    key={optValue}
                    value={getOptionLabel(option)}
                    disabled={getOptionDisabled?.(option)}
                    data-checked={isChecked || undefined}
                    onSelect={() => onSelectChange(optValue)}
                  >
                    <Combobox.Indicator />

                    {getOptionLabel(option)}
                  </Combobox.Item>
                );
              })}

              <Combobox.Loader when={isAsync && infiniteQuery.isFetchingNextPage} message="Loading more..." />
            </Combobox.List>
          </Combobox.Content>
        </Combobox>

        <FormMessage className={errorClassName} hidden={!error} error={error!} />
      </div>
    </FormControl>
  );
}

FormCombobox.displayName = 'FormCombobox';

export default FormCombobox;
