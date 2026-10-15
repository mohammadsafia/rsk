import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type FieldValues, useController } from 'react-hook-form';

import { Calendar, type CalendarProps, fieldVariants, Popover, IconButton } from '@components/ui';
import { Conditional } from '@components/utils';
import { FormControl, FormLabel, FormMessage } from '@components/forms';

import { DATE_INPUT_FORMATS, type DateInputFormat, useAppTranslation, useDateMask } from '@hooks/shared';
import { cn } from '@utils';

import { CalendarIcon, XIcon } from 'lucide-react';

import type { ControlledFieldBaseProps } from '@app-types';

type FormDatePickerProps<TFieldValues extends FieldValues> = ControlledFieldBaseProps<
  TFieldValues,
  Omit<CalendarProps, 'mode' | 'selected'>
> & {
  placeholder?: string;
  dateFormat?: DateInputFormat;
  formatDate?: (date: Date | undefined) => any;
};

function FormDatePicker<TFieldValues extends FieldValues>({
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
  placeholder,
  dateFormat = DATE_INPUT_FORMATS.US_SLASH,
  formatDate,
  ...props
}: FormDatePickerProps<TFieldValues>) {
  const { t } = useAppTranslation('common');

  const [isOpen, setIsOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(undefined);

  const {
    field: { onChange, value, ref, onBlur: fieldOnBlur, ...field },
    fieldState: { error },
  } = useController({
    name,
    control,
    rules,
  });

  const date = useMemo(() => {
    if (!value) return undefined;
    if (Object.prototype.toString.call(value) === '[object Date]') {
      return value as Date;
    }
    if (typeof value === 'string') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
  }, [value]);

  const isUserInputRef = useRef(false);
  const lastSyncedValueRef = useRef<number | null>(null);

  const formatDateValue = useCallback(
    (dateValue: Date | undefined) => {
      if (formatDate) {
        return formatDate(dateValue);
      }
      if (dateValue) {
        const year = dateValue.getFullYear();
        const month = String(dateValue.getMonth() + 1).padStart(2, '0');
        const day = String(dateValue.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return undefined;
    },
    [formatDate],
  );

  const handleDateChange = useCallback(
    (newDate: Date | undefined) => {
      isUserInputRef.current = true;
      onChange(formatDateValue(newDate));
      if (newDate) {
        setCalendarMonth(newDate);
      }
    },
    [onChange, formatDateValue],
  );

  const {
    inputValue,
    handleChange,
    handleKeyDown,
    handlePaste,
    handleBlur,
    setFromDate,
    parsedDate,
    isValidInput,
    placeholder: maskPlaceholder,
  } = useDateMask({
    dateFormat,
    onChange: handleDateChange,
  });

  useEffect(() => {
    if (isUserInputRef.current) {
      isUserInputRef.current = false;
      return;
    }

    const valueKey = date ? date.getTime() : null;

    if (lastSyncedValueRef.current === valueKey) {
      return;
    }

    lastSyncedValueRef.current = valueKey;
    setFromDate(date);
    if (date) {
      setCalendarMonth(date);
    }
  }, [date, setFromDate]);

  useEffect(() => {
    if (parsedDate) {
      setCalendarMonth(parsedDate);
    }
  }, [parsedDate]);

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    onChange(formatDateValue(selectedDate));
    setFromDate(selectedDate);
    if (selectedDate) {
      setCalendarMonth(selectedDate);
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(formatDateValue(undefined));
    setFromDate(undefined);
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
    fieldOnBlur();
    if (!isValidInput) {
      onChange(formatDateValue(undefined));
      setFromDate(undefined);
    }
  };

  const displayPlaceholder = placeholder || maskPlaceholder;

  return (
    <FormControl className={containerClassName}>
      <FormLabel className={labelClassName} htmlFor={name} tooltip={tooltip} required={required} hidden={!label} error={error!}>
        {label}
      </FormLabel>

      <div className="relative">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <div
            data-slot="date-picker-container"
            aria-invalid={!!error || undefined}
            className={cn(fieldVariants(), 'group gap-2 pe-1', error && 'ps-8', disabled && 'pointer-events-none opacity-50', className)}
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
                ref={ref}
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
                aria-invalid={!!error || undefined}
                className={cn(
                  'text-fg placeholder:text-fg-muted min-w-0 flex-1 bg-transparent outline-none',
                  !!inputValue && !isValidInput && 'text-danger',
                )}
                {...field}
              />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Conditional.If condition={!!date && !disabled}>
                <IconButton tabIndex={-1} tone="danger" size="sm" aria-label={t('clear')} onClick={handleClear}>
                  <XIcon size={16} />
                </IconButton>
              </Conditional.If>
            </div>
          </div>

          <Popover.Content className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              captionLayout="dropdown"
              selected={date}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
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
}

FormDatePicker.displayName = 'FormDatePicker';

export default FormDatePicker;
