'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import { type FieldValues, useController } from 'react-hook-form';

import { Calendar, type CalendarProps, fieldVariants, Popover, IconButton } from '@components/ui';
import { Conditional } from '@components/utils';
import { FormField } from '@components/forms';

import { DATE_INPUT_FORMATS, type DateInputFormat, useAppTranslation, useDateMask } from '@hooks/shared';
import { cn, parseDateValue } from '@utils';

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
  description,
  tooltip,
  className,
  required,
  disabled,
  placeholder,
  dateFormat = DATE_INPUT_FORMATS.US_SLASH,
  formatDate,
  ...props
}: FormDatePickerProps<TFieldValues>) {
  // Unique per instance: two forms on one page may share a field name.
  const fieldId = `${name}-${useId()}`;

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

  // An Invalid Date is no date (its time is NaN, which never equals itself, so syncing it would loop).
  const date = useMemo(() => parseDateValue(value), [value]);

  // The form value the text box last took in, and the value the person's typing last produced (undefined: none
  // pending). Only that exact value counts as typed, so a different value set from outside still refills the box.
  const [syncedKey, setSyncedKey] = useState<number | null>(null);
  const [typedValue, setTypedValue] = useState<string | null | undefined>(undefined);

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
      const next = formatDateValue(newDate);
      setTypedValue(next ?? null);
      onChange(next);
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

  // A value from outside (load, reset, setValue) refills the box; a value the person just typed leaves their text alone.
  const valueKey = date ? date.getTime() : null;
  if (valueKey !== syncedKey) {
    setSyncedKey(valueKey);
    // Compared as the form holds it: a date-only string re-parsed and re-formatted can land on another day west of UTC.
    const current = typeof value === 'string' ? value || null : (formatDateValue(date) ?? null);
    const fromTyping = typedValue !== undefined && typedValue === current;
    if (typedValue !== undefined) setTypedValue(undefined);
    if (!fromTyping) {
      setFromDate(date);
      if (date) setCalendarMonth(date);
    }
  }

  // The calendar follows whatever date the box holds.
  const parsedKey = parsedDate ? parsedDate.getTime() : null;
  const [monthFor, setMonthFor] = useState<number | null>(null);
  if (parsedKey !== monthFor) {
    setMonthFor(parsedKey);
    if (parsedDate) setCalendarMonth(parsedDate);
  }

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
    <FormField id={fieldId} label={label} description={description} tooltip={tooltip} required={required} error={error}>
      {(fieldControl) => (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <div
            data-slot="date-picker-container"
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
                ref={ref}
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
      )}
    </FormField>
  );
}

FormDatePicker.displayName = 'FormDatePicker';

export default FormDatePicker;
