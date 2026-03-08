import { useCallback, useEffect, useRef, useState } from 'react';
import { type FieldValues, useController } from 'react-hook-form';

import { Calendar, type CalendarProps, Popover } from '@components/ui';
import { Conditional } from '@components/utils';
import { TooltipButton } from '@components/shared';
import { FormControl, FormLabel, FormMessage } from '@components/forms';

import { DATE_INPUT_FORMATS, type DateInputFormat, useDateMask } from '@hooks/shared';
import { cn } from '@utils';

import { CalendarIcon, XIcon } from 'lucide-react';

import type { ControlledFieldBaseProps } from '@app-types';

type FormDatePickerProps<TFieldValues extends FieldValues> = ControlledFieldBaseProps<
  TFieldValues,
  Omit<CalendarProps, 'mode' | 'selected'>
> & {
  placeholder?: string;
  dateFormat?: DateInputFormat;
};

function FormDatePicker<TFieldValues extends FieldValues>({
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
  placeholder,
  dateFormat = DATE_INPUT_FORMATS.US_SLASH,
  ...props
}: FormDatePickerProps<TFieldValues>) {
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

  const date = value as Date | undefined;
  const isUserInputRef = useRef(false);
  const lastSyncedValueRef = useRef<number | null>(null);

  const handleDateChange = useCallback(
    (newDate: Date | undefined) => {
      isUserInputRef.current = true;
      onChange(newDate);
      if (newDate) {
        setCalendarMonth(newDate);
      }
    },
    [onChange],
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

    const valueKey = date?.getTime() ?? null;
    if (lastSyncedValueRef.current === valueKey) {
      return;
    }

    lastSyncedValueRef.current = valueKey;
    setFromDate(date);
    if (date) {
      setCalendarMonth(date);
    }
  }, [date]);

  useEffect(() => {
    if (parsedDate) {
      setCalendarMonth(parsedDate);
    }
  }, [parsedDate]);

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    onChange(selectedDate);
    setFromDate(selectedDate);
    if (selectedDate) {
      setCalendarMonth(selectedDate);
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(undefined);
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
      onChange(undefined);
      setFromDate(undefined);
    }
  };

  const displayPlaceholder = placeholder || maskPlaceholder;

  return (
    <FormControl className={containerClassName}>
      <FormLabel className={labelClassName} hidden={!label} error={error!} htmlFor={name} required={required}>
        {label}
      </FormLabel>

      <div className="relative">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <div
            data-slot="date-picker-container"
            className={cn(
              'group bg-background relative flex h-12 w-full items-center rounded-md border px-3 py-3 text-xs shadow-xs',
              'transition-colors focus-within:outline-none',
              {
                'border-muted-200 hover:border-muted-300 focus-within:border-primary focus-within:ring-primary focus-within:ring-1': !error,
                'border-destructive focus-within:border-destructive focus-within:ring-destructive focus-within:ring-1': !!error,
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
                aria-invalid={!!error}
                className={cn('min-w-0 flex-1 bg-transparent text-xs outline-none', 'placeholder:text-muted-400', {
                  'text-primary-900': !!inputValue && isValidInput,
                  'text-destructive': !!inputValue && !isValidInput,
                })}
                {...field}
              />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Conditional.If condition={!!date && !disabled}>
                <TooltipButton tabIndex={-1} title="Clear" variant="ghost-muted-destructive" size="unstyled" onClick={handleClear}>
                  <XIcon size={16} />
                </TooltipButton>
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
