import { useState } from 'react';

import { type FieldValues, useController } from 'react-hook-form';

import { Badge, Button, Checkbox } from '@components/ui';
import { Conditional } from '@components/utils';
import { Combobox } from '@components/shared';
import { FormControl, FormLabel, FormMessage } from '@components/forms';

import { cn } from '@utils';

import { type AsyncOptionsFn, useAsyncOptionsInfiniteQuery, useDebounce, useInfiniteScroll } from '@hooks/shared';

import { XIcon } from 'lucide-react';

import type { ControlledFieldBaseProps, FormSelectOption, ResolvedOption } from '@app-types';

type FormMultiComboboxOwnProps<TOption> = {
  options: TOption[] | AsyncOptionsFn<TOption>;
  getOptionLabel: (option: TOption) => string;
  getOptionValue: (option: TOption) => string;
  getOptionDisabled?: (option: TOption) => boolean;
  optionMapper?: (option: TOption) => TOption;
  valueType?: 'flat' | 'contain';
  onOptionChange?: (options: TOption[]) => void;
  placeholder?: string;
  noOptionsText?: string;
  disabled?: boolean;
  className?: string;
  urlSearchParams?: URLSearchParams | string;
  debounceMs?: number;
  pageSize?: number;
};

type FormMultiComboboxProps<TFieldValues extends FieldValues, TOption = FormSelectOption> = ControlledFieldBaseProps<
  TFieldValues,
  FormMultiComboboxOwnProps<ResolvedOption<TOption>>
>;

function FormMultiCombobox<TFieldValues extends FieldValues, TOption = FormSelectOption>({
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
}: FormMultiComboboxProps<TFieldValues, TOption>) {
  const {
    field: { ref, value, onChange, ...field },
    fieldState: { error },
  } = useController<TFieldValues>({ name, control, rules });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, debounceMs);

  const isAsync = typeof options === 'function';

  // Value resolution: flat (string[]) vs contain (TOption[])
  const stringValues = (() => {
    if (!value || !Array.isArray(value)) return [] as string[];

    if (valueType === 'contain') return value.map((option: TOption) => getOptionValue(option));

    return value as string[];
  })();

  const selectedItemsIds = stringValues;
  const hasValueToResolve = valueType === 'flat' && selectedItemsIds.length > 0;

  const infiniteQuery = useAsyncOptionsInfiniteQuery({
    queryKey: `${label}-${name}-multi-combobox-options`,
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

  const selectedSet = new Set(stringValues);

  // Contain mode: value IS the full objects — use directly. Flat mode: resolve from fetched options.
  const selectedOptions =
    valueType === 'contain' && Array.isArray(value) ? (value as TOption[]) : allOptions.filter((o) => selectedSet.has(getOptionValue(o)));

  const onToggleValue = (optValue: string) => {
    const isRemoving = selectedSet.has(optValue);

    if (valueType === 'contain') {
      const current = (value as TOption[]) ?? [];
      const next = isRemoving
        ? current.filter((o) => getOptionValue(o) !== optValue)
        : [...current, allOptions.find((o) => getOptionValue(o) === optValue)!];

      onChange(next);
      onOptionChange?.(next);
    } else {
      const next = new Set(selectedSet);
      isRemoving ? next.delete(optValue) : next.add(optValue);

      const nextValues = Array.from(next);
      onChange(nextValues);
      onOptionChange?.(allOptions.filter((o) => next.has(getOptionValue(o))));
    }
  };

  const onClear = () => {
    onChange([]);
    onOptionChange?.([]);
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
            onBlur={field.onBlur}
            disabled={field.disabled || disabled}
            className={cn(
              error &&
                'border-destructive hover:not-disabled:border-destructive hover:not-disabled:ring-destructive focus-visible:border-destructive focus-visible:ring-destructive text-destructive ps-8',
              className,
            )}
          >
            <Combobox.Value placeholder={placeholder}>
              <Conditional>
                <Conditional.If condition={selectedOptions.length > 0}>
                  <span className="line-clamp-1 truncate">
                    {selectedOptions.map((opt) => (
                      <Badge key={getOptionValue(opt)} className="not-last:me-1">
                        {getOptionLabel(opt)}

                        <Conditional.If condition={!field.disabled && !disabled}>
                          <Button
                            asChild
                            variant="ghost-muted-destructive"
                            size="unstyled"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onToggleValue(getOptionValue(opt));
                            }}
                          >
                            <XIcon size={12} />
                          </Button>
                        </Conditional.If>
                      </Badge>
                    ))}
                  </span>
                </Conditional.If>

                <Conditional.Else>{placeholder}</Conditional.Else>
              </Conditional>
            </Combobox.Value>

            <Combobox.Clear when={selectedSet.size > 0 && !field.disabled && !disabled} onClear={onClear} />

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
                const isChecked = selectedSet.has(optValue);

                return (
                  <Combobox.Item
                    key={optValue}
                    value={getOptionLabel(option)}
                    disabled={getOptionDisabled?.(option)}
                    data-checked={isChecked || undefined}
                    onSelect={() => onToggleValue(optValue)}
                  >
                    <Combobox.Indicator>
                      <Checkbox checked={isChecked} variant="primary" tabIndex={-1} className="pointer-events-none" />
                    </Combobox.Indicator>

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

FormMultiCombobox.displayName = 'FormMultiCombobox';

export default FormMultiCombobox;
