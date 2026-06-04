import { type FC, type RefCallback, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type DateRange } from 'react-day-picker';
import { type FieldError, type FieldPath, type FieldValues, useController } from 'react-hook-form';

import { Calendar, type CalendarProps, Popover } from '@components/ui';
import { TooltipButton } from '@components/shared';
import { Conditional } from '@components/utils';
import { FormControl, FormLabel, FormMessage } from '@components/forms';

import { DATE_INPUT_FORMATS, type DateInputFormat, useDateRangeMask } from '@hooks/shared';
import { cn } from '@utils';

import { CalendarIcon, XIcon } from 'lucide-react';

import type { ControlledFieldBaseProps } from '@app-types';

type FormDateRangeBaseProps<TFieldValues extends FieldValues> = Omit<
  ControlledFieldBaseProps<TFieldValues, Omit<CalendarProps, 'mode' | 'selected'>>,
  'name'
> & {
  placeholder?: string;
  dateFormat?: DateInputFormat;
  formatDateValue?: (date: Date | undefined) => unknown;
};

type FormDateRangeCompositeProps<TFieldValues extends FieldValues> = FormDateRangeBaseProps<TFieldValues> & {
  name: FieldPath<TFieldValues>;
  fromName?: never;
  toName?: never;
};

type FormDateRangeFlatProps<TFieldValues extends FieldValues> = FormDateRangeBaseProps<TFieldValues> & {
  name?: never;
  fromName: FieldPath<TFieldValues>;
  toName: FieldPath<TFieldValues>;
};

export type FormDateRangeProps<TFieldValues extends FieldValues> =
  | FormDateRangeCompositeProps<TFieldValues>
  | FormDateRangeFlatProps<TFieldValues>;

type FormDateRangeCoreProps = FormDateRangeBaseProps<FieldValues> & {
  name: string;
  dateRange: DateRange | undefined;
  onRangeChange: (range: DateRange | undefined) => void;
  onBlur: () => void;
  inputRef: RefCallback<HTMLInputElement> | undefined;
  error: FieldError | undefined;
};

const parseDateValue = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
};

const parseCompositeValue = (value: unknown): DateRange | undefined => {
  if (!value) return undefined;
  const obj = value as { from?: unknown; to?: unknown };
  const from = parseDateValue(obj.from);
  const to = parseDateValue(obj.to);
  if (!from && !to) return undefined;
  return { from, to };
};

const FormDateRangeCore: FC<FormDateRangeCoreProps> = ({
  name,
  dateRange,
  onRangeChange,
  onBlur,
  inputRef,
  error,
  label,
  tooltip,
  containerClassName,
  labelClassName,
  className,
  errorClassName,
  required,
  disabled,
  placeholder,
  dateFormat = DATE_INPUT_FORMATS.US_SLASH,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(undefined);

  const isUserInputRef = useRef(false);
  const lastSyncedValueRef = useRef<string | null>(null);

  const handleRangeChange = useCallback((newRange: { from?: Date; to?: Date } | undefined) => {
    isUserInputRef.current = true;
    if (!newRange) {
      onRangeChange(undefined);
      return;
    }
    onRangeChange({ from: newRange.from, to: newRange.to });
    if (newRange.from) {
      setCalendarMonth(newRange.from);
    } else if (newRange.to) {
      setCalendarMonth(newRange.to);
    }
  }, []);

  const {
    inputValue,
    handleChange,
    handleKeyDown,
    handlePaste,
    handleBlur,
    setFromDateRange,
    parsedRange,
    isValidInput,
    placeholder: maskPlaceholder,
  } = useDateRangeMask({
    dateFormat,
    onChange: handleRangeChange,
  });

  useEffect(() => {
    if (isUserInputRef.current) {
      isUserInputRef.current = false;
      return;
    }

    const valueKey = dateRange ? `${dateRange.from?.getTime()}-${dateRange.to?.getTime()}` : 'empty';
    if (lastSyncedValueRef.current === valueKey) {
      return;
    }

    lastSyncedValueRef.current = valueKey;

    if (dateRange) {
      setFromDateRange({ from: dateRange.from, to: dateRange.to });
      if (dateRange.from) {
        setCalendarMonth(dateRange.from);
      }
    } else {
      setFromDateRange(undefined);
    }
  }, [dateRange]);

  useEffect(() => {
    if (parsedRange.from) {
      setCalendarMonth(parsedRange.from);
    } else if (parsedRange.to) {
      setCalendarMonth(parsedRange.to);
    }
  }, [parsedRange.from, parsedRange.to]);

  const handleCalendarSelect = (selectedRange: DateRange | undefined) => {
    onRangeChange(selectedRange);
    if (selectedRange) {
      setFromDateRange({ from: selectedRange.from, to: selectedRange.to });
      if (selectedRange.from) {
        setCalendarMonth(selectedRange.from);
      }
    }
  };

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onRangeChange(undefined);
    setFromDateRange(undefined);
  };

  const handleIconClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    handleBlur();
    onBlur();
  };

  const displayPlaceholder = placeholder || maskPlaceholder;
  const hasValue = dateRange?.from || dateRange?.to;

  return (
    <FormControl className={containerClassName}>
      <FormLabel className={labelClassName} htmlFor={name} tooltip={tooltip} required={required} hidden={!label} error={error!}>
        {label}
      </FormLabel>

      <div className="relative">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <div
            data-slot="date-range-container"
            className={cn(
              'group bg-background relative flex h-12 w-full items-center rounded-md border px-3 py-3 text-xs shadow-xs',
              'transition-colors focus-within:outline-none',
              {
                'border-muted-200 hover:border-muted-300 focus-within:border-primary focus-within:ring-primary focus-within:ring-1': !error,
                'border-destructive focus-within:border-destructive focus-within:ring-destructive ps-8 focus-within:ring-1': !!error,
                'pointer-events-none cursor-not-allowed opacity-50': disabled,
              },
              className,
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Popover.Trigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={handleIconClick}
                  className="shrink-0 focus:outline-none"
                  aria-label="Open calendar"
                  tabIndex={-1}
                >
                  <CalendarIcon
                    size={20}
                    className={cn('h-5 w-5 cursor-pointer transition-colors', {
                      'text-destructive': !!error,
                      'text-muted-300 opacity-50': disabled,
                      'text-muted-400 hover:text-primary': !error && !disabled,
                      'text-primary': isOpen && !error && !disabled,
                    })}
                  />
                </button>
              </Popover.Trigger>

              <input
                ref={inputRef}
                id={name}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                disabled={disabled}
                placeholder={displayPlaceholder}
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onBlur={handleInputBlur}
                aria-invalid={!!error}
                className={cn('min-w-0 flex-1 bg-transparent text-xs outline-none', 'placeholder:text-muted-400', {
                  'text-primary-900': !!inputValue && isValidInput,
                  'text-destructive': !!inputValue && !isValidInput,
                })}
              />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Conditional.If condition={!!hasValue && !disabled}>
                <TooltipButton tabIndex={-1} title="Clear" variant="ghost-muted-destructive" size="unstyled" onClick={handleClear}>
                  <XIcon size={16} />
                </TooltipButton>
              </Conditional.If>
            </div>
          </div>

          <Popover.Content className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              captionLayout="dropdown"
              selected={dateRange}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              numberOfMonths={2}
              onSelect={handleCalendarSelect}
              autoFocus
              {...props}
            />
          </Popover.Content>
        </Popover>

        <FormMessage className={errorClassName} hidden={!error} error={error!} />
      </div>
    </FormControl>
  );
};

function FormDateRangeComposite<TFieldValues extends FieldValues>({
  name,
  rules,
  control,
  formatDateValue,
  ...rest
}: FormDateRangeCompositeProps<TFieldValues>) {
  const {
    field: { onChange, value, ref, onBlur },
    fieldState: { error },
  } = useController({ name, control, rules });

  const dateRange = useMemo(() => parseCompositeValue(value), [value]);

  const onRangeChange = (range: DateRange | undefined) => {
    if (!formatDateValue) {
      onChange(range);
      return;
    }
    onChange(range ? { from: formatDateValue(range.from), to: formatDateValue(range.to) } : undefined);
  };

  return (
    <FormDateRangeCore
      {...rest}
      name={name}
      dateRange={dateRange}
      onRangeChange={onRangeChange}
      onBlur={onBlur}
      inputRef={ref}
      error={error}
    />
  );
}

function FormDateRangeFlat<TFieldValues extends FieldValues>({
  fromName,
  toName,
  rules,
  control,
  formatDateValue,
  ...rest
}: FormDateRangeFlatProps<TFieldValues>) {
  const fromController = useController({ name: fromName, control, rules });
  const toController = useController({ name: toName, control, rules });

  const fromValue = fromController.field.value;
  const toValue = toController.field.value;

  const dateRange = useMemo<DateRange | undefined>(() => {
    const from = parseDateValue(fromValue);
    const to = parseDateValue(toValue);
    if (!from && !to) return undefined;
    return { from, to };
  }, [fromValue, toValue]);

  const onRangeChange = (range: DateRange | undefined) => {
    const fromOut = formatDateValue ? formatDateValue(range?.from) : range?.from;
    const toOut = formatDateValue ? formatDateValue(range?.to) : range?.to;
    fromController.field.onChange(fromOut ?? null);
    toController.field.onChange(toOut ?? null);
  };

  const onBlur = () => {
    fromController.field.onBlur();
    toController.field.onBlur();
  };

  const error = fromController.fieldState.error ?? toController.fieldState.error;

  return (
    <FormDateRangeCore
      {...rest}
      name={fromName}
      dateRange={dateRange}
      onRangeChange={onRangeChange}
      onBlur={onBlur}
      inputRef={fromController.field.ref}
      error={error}
    />
  );
}

function FormDateRange<TFieldValues extends FieldValues>(props: FormDateRangeProps<TFieldValues>) {
  if ('fromName' in props && props.fromName) {
    return <FormDateRangeFlat {...(props as FormDateRangeFlatProps<TFieldValues>)} />;
  }
  return <FormDateRangeComposite {...(props as FormDateRangeCompositeProps<TFieldValues>)} />;
}

FormDateRange.displayName = 'FormDateRange';

export default FormDateRange;
