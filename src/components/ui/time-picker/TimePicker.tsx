'use client';

import {
  type ComponentPropsWithoutRef,
  type ComponentPropsWithRef,
  type FC,
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';

import { Button, fieldVariants, type FieldVariants, IconButton, Popover } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation, useDebounce } from '@hooks/shared';

import { cn } from '@utils';

import { Clock4Icon, XIcon } from 'lucide-react';

import {
  availableTimes,
  buildTimeColumns,
  formatTime,
  nearestTime,
  parseTime,
  selectHour,
  selectMinute,
  selectPeriod,
  type TimePeriod,
} from './timeColumns';

export type TimePickerClearProps = {
  onClear?: () => void;
  disabled?: boolean;
  hasValue?: boolean;
};

export type TimePickerTriggerProps = Omit<ComponentPropsWithRef<'button'>, 'value'> &
  FieldVariants & {
    invalid?: boolean;
    placeholder?: string;
    displayValue?: string | null;
  };

export type TimePickerContentProps = ComponentPropsWithoutRef<typeof Popover.Content> & {
  /** Accepted for compatibility (TimeFilter passes it); the columns follow `tempValue`. */
  value?: string | null;
  tempValue: string;
  onTempValueChange: (value: string) => void;
  onConfirm: () => void;
  use24hFormat?: boolean;
  min?: string;
  max?: string;
  step?: number;
};

export type TimePickerRootProps = ComponentPropsWithoutRef<typeof Popover>;

export type TimePickerProps = FieldVariants & {
  name: string;
  id?: string;
  value?: string | null;
  onChange?: (value?: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  clearButton?: boolean;
  use24hFormat?: boolean;
  min?: string;
  max?: string;
  step?: number;
  startAt?: string;
  invalid?: boolean;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
};

type TimeColumnProps<TValue extends number | string> = {
  label: string;
  options: Array<{ label: string; value: TValue }>;
  selected: TValue;
  onSelect: (value: TValue) => void;
};

const scrollSelectedIntoView = (node: HTMLButtonElement | null) => node?.scrollIntoView?.({ block: 'nearest' });

const NEXT_INDEX: Record<string, (index: number, last: number) => number> = {
  ArrowDown: (index, last) => Math.min(index + 1, last),
  ArrowUp: (index) => Math.max(index - 1, 0),
  Home: () => 0,
  End: (_index, last) => last,
};

// One tab stop per column (the selected option); arrows, Home and End move the selection.
function TimeColumn<TValue extends number | string>({ label, options, selected, onSelect }: TimeColumnProps<TValue>) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const move = NEXT_INDEX[event.key];
    if (!move) return;

    event.preventDefault();
    const next = move(index, options.length - 1);
    onSelect(options[next].value);
    (event.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
  };

  return (
    <div
      role="listbox"
      aria-label={label}
      data-slot="time-picker-column"
      className="flex max-h-48 w-12 [scrollbar-width:thin] flex-col gap-0.5 overflow-y-auto font-mono text-sm"
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          role="option"
          aria-selected={option.value === selected}
          tabIndex={option.value === selected ? 0 : -1}
          ref={option.value === selected ? scrollSelectedIntoView : undefined}
          className={cn(
            'focus-ring text-fg-muted hover:bg-hover hover:text-fg h-7 shrink-0 cursor-pointer rounded-md tabular-nums transition-colors',
            'aria-selected:text-fg aria-selected:ink',
          )}
          onClick={() => onSelect(option.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const TimePickerClear: FC<TimePickerClearProps> = ({ onClear, disabled, hasValue }) => {
  const { t } = useAppTranslation('common');

  if (!hasValue || !onClear || disabled) return null;

  return (
    <IconButton
      data-slot="time-picker-clear"
      size="sm"
      tooltip={false}
      aria-label={t('clear')}
      className="absolute inset-y-0 end-1 my-auto"
      onClick={onClear}
    >
      <XIcon />
    </IconButton>
  );
};

const TimePickerTrigger: FC<TimePickerTriggerProps> = ({
  ref,
  className,
  size,
  invalid,
  placeholder,
  displayValue,
  disabled,
  ...props
}) => {
  // role="combobox" isn't named by its content (as Combobox's trigger): without a label, its own visible text names it.
  const textId = useId();
  const labelledBy = props['aria-labelledby'] ?? (props['aria-label'] ? undefined : textId);

  return (
    <button
      ref={ref}
      type="button"
      // A field that opens a panel of options, like Select's trigger: combobox also supports aria-invalid (button doesn't).
      role="combobox"
      disabled={disabled}
      aria-invalid={invalid || undefined}
      className={cn(fieldVariants({ size }), 'group cursor-pointer gap-2 text-start', className)}
      {...props}
      aria-labelledby={labelledBy}
      // After the spread: Popover.Trigger asChild injects its own data-slot.
      data-slot="time-picker-trigger"
    >
      <Clock4Icon aria-hidden="true" className="text-fg-muted group-data-[state=open]:text-accent size-4 shrink-0" />

      <Conditional>
        <Conditional.If condition={!!displayValue}>
          <span id={textId} className="text-fg min-w-0 flex-1 truncate font-mono tabular-nums">
            <bdi dir="ltr">{displayValue}</bdi>
          </span>
        </Conditional.If>

        <Conditional.Else>
          <span id={textId} className="text-fg-muted min-w-0 flex-1 truncate">
            {placeholder}
          </span>
        </Conditional.Else>
      </Conditional>
    </button>
  );
};

const TimePickerContent: FC<TimePickerContentProps> = ({
  className,
  value: _value,
  tempValue,
  onTempValueChange,
  onConfirm,
  use24hFormat = false,
  min = '00:00',
  max = '23:59',
  step = 1,
  ...props
}) => {
  const { t } = useAppTranslation('common');

  const available = useMemo(() => availableTimes(min, max, step), [min, max, step]);
  const selected = nearestTime(available, parseTime(tempValue));

  const handleSelect = (next: number) => onTempValueChange(formatTime(next, use24hFormat));

  // Snap a seed that is off the grid or out of range (e.g. TimeFilter's "08:00 AM" with min 09:00) to the option shown,
  // so confirming without touching the columns emits exactly what is highlighted.
  useEffect(() => {
    if (tempValue === '' || selected === null) return;
    const normalized = formatTime(selected, use24hFormat);
    if (normalized !== tempValue) onTempValueChange(normalized);
  }, [tempValue, selected, use24hFormat, onTempValueChange]);

  return (
    <Popover.Content data-slot="time-picker-content" side="bottom" align="start" className={cn('w-fit p-2', className)} {...props}>
      <Conditional.If condition={selected !== null}>
        <TimePickerColumns
          available={available}
          selected={selected ?? 0}
          use24hFormat={use24hFormat}
          labels={{ hours: t('timePicker.hours'), minutes: t('timePicker.minutes'), period: t('timePicker.period') }}
          onSelect={handleSelect}
        />
      </Conditional.If>

      <div className="border-border-subtle mt-2 flex justify-end border-t pt-2">
        <Button size="sm" tone="accent" onClick={onConfirm}>
          {t('confirm')}
        </Button>
      </div>
    </Popover.Content>
  );
};

type TimePickerColumnsProps = {
  available: number[];
  selected: number;
  use24hFormat: boolean;
  labels: { hours: string; minutes: string; period: string };
  onSelect: (time: number) => void;
};

const TimePickerColumns: FC<TimePickerColumnsProps> = ({ available, selected, use24hFormat, labels, onSelect }) => {
  const columns = buildTimeColumns(available, selected, use24hFormat);
  const periodOptions = columns.periods.map((period) => ({ label: period, value: period }));

  return (
    <div className="flex gap-1">
      <TimeColumn
        label={labels.hours}
        options={columns.hours}
        selected={Math.floor(selected / 60)}
        onSelect={(hour) => onSelect(selectHour(available, selected, hour))}
      />

      <TimeColumn
        label={labels.minutes}
        options={columns.minutes}
        selected={selected % 60}
        onSelect={(minute) => onSelect(selectMinute(available, selected, minute))}
      />

      <Conditional.If condition={!use24hFormat}>
        <TimeColumn<TimePeriod>
          label={labels.period}
          options={periodOptions}
          selected={selected >= 12 * 60 ? 'PM' : 'AM'}
          onSelect={(period) => onSelect(selectPeriod(available, selected, period))}
        />
      </Conditional.If>
    </div>
  );
};

const TimePickerRoot: FC<TimePickerRootProps> = ({ children, ...props }) => (
  <Popover data-slot="time-picker-root" modal {...props}>
    {children}
  </Popover>
);

type TimePickerComponent = FC<TimePickerProps> & {
  Root: typeof TimePickerRoot;
  Trigger: typeof TimePickerTrigger;
  Content: typeof TimePickerContent;
  Clear: typeof TimePickerClear;
};

const TimePicker: TimePickerComponent = ({
  name,
  id,
  className,
  disabled,
  placeholder,
  clearButton = true,
  min = '00:00',
  startAt,
  max = '23:59',
  step = 1,
  use24hFormat = false,
  size,
  value,
  onChange,
  invalid = false,
  'aria-describedby': ariaDescribedBy,
  'aria-required': ariaRequired,
}) => {
  const { t } = useAppTranslation('common');

  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState('');
  const display = useDebounce(tempValue || value, 200);

  const available = useMemo(() => availableTimes(min, max, step), [min, max, step]);

  // Seed on the step grid in the picker's own format, so confirming untouched never emits a 12h string in 24h mode.
  const seed = () => {
    const time = nearestTime(available, parseTime(value) ?? parseTime(startAt) ?? parseTime(use24hFormat ? '08:00' : '08:00 AM'));
    return time === null ? '' : formatTime(time, use24hFormat);
  };
  // Seeded when it opens (and re-seeded if its inputs change while open); the scratch value is cleared on every close.
  const onOpenChange = (next: boolean) => {
    setTempValue(next ? seed() : '');
    setIsOpen(next);
  };
  const seedInputs = [value, startAt, min, max, step, use24hFormat].join('|');
  const [seededFor, setSeededFor] = useState(seedInputs);
  if (seedInputs !== seededFor) {
    setSeededFor(seedInputs);
    if (isOpen) setTempValue(seed());
  }

  const handleConfirm = () => {
    onChange?.(tempValue || undefined);
    onOpenChange(false);
  };

  const handleClear = () => onChange?.(undefined);

  const showClear = clearButton && !!value && !disabled;

  return (
    <div data-slot="time-picker" className="relative w-full">
      <Popover open={isOpen} onOpenChange={onOpenChange} modal>
        <Popover.Trigger id={id ?? name} asChild>
          <TimePickerTrigger
            size={size}
            aria-describedby={ariaDescribedBy}
            aria-required={ariaRequired}
            invalid={invalid}
            disabled={disabled}
            placeholder={placeholder ?? t('timePicker.placeholder')}
            displayValue={display}
            className={cn(showClear && 'pe-9', className)}
          />
        </Popover.Trigger>

        <TimePickerContent
          tempValue={tempValue}
          onTempValueChange={setTempValue}
          onConfirm={handleConfirm}
          use24hFormat={use24hFormat}
          min={min}
          max={max}
          step={step}
        />
      </Popover>

      <Conditional.If condition={clearButton}>
        <TimePickerClear onClear={handleClear} disabled={disabled} hasValue={!!value} />
      </Conditional.If>
    </div>
  );
};

TimePicker.Root = TimePickerRoot;
TimePicker.Trigger = TimePickerTrigger;
TimePicker.Content = TimePickerContent;
TimePicker.Clear = TimePickerClear;

TimePickerTrigger.displayName = 'TimePickerTrigger';
TimePickerContent.displayName = 'TimePickerContent';
TimePickerClear.displayName = 'TimePickerClear';

export default TimePicker;
