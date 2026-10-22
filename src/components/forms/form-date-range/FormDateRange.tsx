'use client';

import { type FC, type RefCallback, useCallback, useId, useMemo, useState } from 'react';

import { type DateRange } from 'react-day-picker';
import { type FieldError, type FieldPath, type FieldValues, useController } from 'react-hook-form';

import { Calendar, type CalendarProps, fieldVariants, Popover, IconButton } from '@components/ui';
import { Conditional } from '@components/utils';
import { FormField } from '@components/forms';

import { DATE_INPUT_FORMATS, type DateInputFormat, useAppTranslation, useDateRangeMask } from '@hooks/shared';
import { cn, parseDateValue } from '@utils';

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
  description,
  tooltip,
  className,
  required,
  disabled,
  placeholder,
  dateFormat = DATE_INPUT_FORMATS.US_SLASH,
  ...props
}) => {
  const { t } = useAppTranslation('common');
  // Unique per instance: two forms on one page may share a field name.
  const fieldId = `${name}-${useId()}`;

  const [isOpen, setIsOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(undefined);

  // The form value the text box last took in, and whether the latest change came from typing (keep the person's text).
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  const [typed, setTyped] = useState(false);

  const handleRangeChange = useCallback((newRange: { from?: Date; to?: Date } | undefined) => {
    setTyped(true);
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

  // A range from outside (load, reset, setValue) refills the box; a range the person just typed leaves their text alone.
  const valueKey = dateRange ? `${dateRange.from?.getTime()}-${dateRange.to?.getTime()}` : 'empty';
  if (valueKey !== syncedKey) {
    setSyncedKey(valueKey);
    if (typed) setTyped(false);
    else if (dateRange) {
      setFromDateRange({ from: dateRange.from, to: dateRange.to });
      if (dateRange.from) setCalendarMonth(dateRange.from);
    } else {
      setFromDateRange(undefined);
    }
  }

  // The calendar follows the range the box holds: its start, or its end while only that is typed.
  const parsedKey = `${parsedRange.from?.getTime()}-${parsedRange.to?.getTime()}`;
  const [monthFor, setMonthFor] = useState(parsedKey);
  if (parsedKey !== monthFor) {
    setMonthFor(parsedKey);
    if (parsedRange.from) setCalendarMonth(parsedRange.from);
    else if (parsedRange.to) setCalendarMonth(parsedRange.to);
  }

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
    <FormField id={fieldId} label={label} description={description} tooltip={tooltip} required={required} error={error}>
      {(fieldControl) => (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <div
            data-slot="date-range-container"
            aria-invalid={fieldControl.invalid || undefined}
            data-disabled={disabled || undefined}
            className={cn(
              fieldVariants(),
              'group gap-2 pe-1',
              'data-disabled:border-border data-disabled:bg-surface-sunken data-disabled:text-fg-subtle data-disabled:pointer-events-none',
              className,
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Popover.Trigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={handleIconClick}
                  className="focus-ring shrink-0 rounded-sm"
                  aria-label={t('openCalendar')}
                  tabIndex={-1}
                >
                  <CalendarIcon
                    aria-hidden="true"
                    className={cn(
                      'text-fg-muted hover:text-fg size-4 cursor-pointer transition-colors',
                      isOpen && 'text-accent',
                      !!error && 'text-danger',
                    )}
                  />
                </button>
              </Popover.Trigger>

              <input
                ref={inputRef}
                id={fieldControl.id}
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
                aria-invalid={fieldControl.invalid || undefined}
                aria-describedby={fieldControl['aria-describedby']}
                aria-required={fieldControl['aria-required']}
                className={cn(
                  'text-fg placeholder:text-fg-muted min-w-0 flex-1 bg-transparent outline-none',
                  !!inputValue && !isValidInput && 'text-danger',
                )}
              />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Conditional.If condition={!!hasValue && !disabled}>
                <IconButton tabIndex={-1} tone="danger" size="sm" aria-label={t('clear')} onClick={handleClear}>
                  <XIcon size={16} />
                </IconButton>
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
      )}
    </FormField>
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
