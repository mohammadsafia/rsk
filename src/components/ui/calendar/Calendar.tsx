'use client';

import { type ChangeEvent, type ComponentProps, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type DateRange, DayButton, DayPicker, type DropdownProps, getDefaultClassNames } from 'react-day-picker';
import { ar, enUS } from 'react-day-picker/locale';

import { buttonVariants, type ButtonVariants, Select } from '@components/ui';

import { useAppTranslation } from '@hooks/shared';

import { cn, mergeRefs } from '@utils';

import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useDirection } from '@radix-ui/react-direction';

export type CalendarRange = DateRange;

export type CalendarProps = ComponentProps<typeof DayPicker> & {
  buttonVariant?: ButtonVariants['variant'];
};

function CalendarDayButton({ className, day, modifiers, ...props }: ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const isSelectedSingle = modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle;

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString()}
      data-today={modifiers.today}
      data-selected-single={isSelectedSingle}
      data-range-start={modifiers.range_start}
      data-range-middle={modifiers.range_middle}
      data-range-end={modifiers.range_end}
      data-outside={modifiers.outside}
      data-disabled={modifiers.disabled}
      className={cn(
        'focus-ring text-fg hover:bg-hover inline-flex size-(--cell-size) cursor-pointer items-center justify-center rounded-md text-sm tabular-nums transition-colors',
        'data-[today=true]:ring-border-strong data-[today=true]:font-semibold data-[today=true]:ring-1 data-[today=true]:ring-inset',
        'data-[selected-single=true]:bg-accent data-[selected-single=true]:text-accent-fg data-[selected-single=true]:ring-0',
        'data-[range-start=true]:bg-accent data-[range-start=true]:text-accent-fg data-[range-end=true]:bg-accent data-[range-end=true]:text-accent-fg',
        'data-[range-middle=true]:text-fg data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-transparent',
        'data-[outside=true]:text-fg-muted data-[disabled=true]:text-fg-subtle data-[disabled=true]:pointer-events-none data-[disabled=true]:line-through',
        '[&>span]:text-xs [&>span]:opacity-70',
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

function CalendarMonthsDropdown({ options, value, onChange, disabled, 'aria-label': ariaLabel }: DropdownProps) {
  if (!options || options.length === 0) return <></>;

  const selectOptions = options.map((option) => ({
    id: String(option.value),
    name: option.label,
  }));

  const handleValueChange = (newValue: string) => {
    const numericValue = Number(newValue);

    if (onChange) {
      onChange({ target: { value: String(numericValue) } } as ChangeEvent<HTMLSelectElement>);
    }
  };

  return (
    <Select value={value !== null ? String(value) : ''} onValueChange={handleValueChange} disabled={disabled}>
      <Select.Trigger size="sm" aria-label={ariaLabel} className="justify-center">
        <Select.Value className="text-center" />

        <Select.Icon />
      </Select.Trigger>

      <Select.Content position="popper">
        {selectOptions.map((option) => (
          <Select.Item
            key={option.id}
            value={option.id}
            disabled={options.find((o) => String(o.value) === option.id)?.disabled}
            className="justify-center text-center"
          >
            <Select.Text>{option.name}</Select.Text>
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
}

function CalendarYearsDropdown({ options, value, onChange, disabled, 'aria-label': ariaLabel }: DropdownProps) {
  if (!options || options.length === 0) return <></>;

  const selectOptions = options.map((option) => ({
    id: String(option.value),
    name: option.label,
  }));

  const handleValueChange = (newValue: string) => {
    const numericValue = Number(newValue);
    if (onChange) {
      onChange({ target: { value: String(numericValue) } } as ChangeEvent<HTMLSelectElement>);
    }
  };

  return (
    <Select value={value !== null ? String(value) : ''} onValueChange={handleValueChange} disabled={disabled}>
      <Select.Trigger size="sm" aria-label={ariaLabel} className="justify-center">
        <Select.Value className="text-center" />

        <Select.Icon />
      </Select.Trigger>

      <Select.Content position="popper">
        {selectOptions.map((option) => (
          <Select.Item
            key={option.id}
            value={option.id}
            disabled={options.find((o) => String(o.value) === option.id)?.disabled}
            className="justify-center text-center"
          >
            <Select.Text>{option.name}</Select.Text>
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = 'label',
  buttonVariant = 'ghost',
  formatters,
  components,
  labels,
  ...props
}: CalendarProps) {
  const { t, isRTL } = useAppTranslation('common');
  // Layout follows the surrounding direction (an RTL section in an English app mirrors); month names follow the language.
  const contextDirection = useDirection();
  // Radix answers 'ltr' when there is no DirectionProvider at all, so a plain dir="rtl" ancestor counts too.
  const rootElement = useRef<HTMLDivElement | null>(null);
  const [inheritedDirection, setInheritedDirection] = useState<'ltr' | 'rtl'>('ltr');
  useLayoutEffect(() => {
    const inherited = rootElement.current?.parentElement?.closest('[dir]')?.getAttribute('dir') === 'rtl' ? 'rtl' : 'ltr';
    setInheritedDirection(inherited);
    // Re-read when the language (and with it the document's dir) or the surrounding provider's direction changes.
  }, [isRTL, contextDirection]);
  const direction = contextDirection === 'rtl' ? 'rtl' : inheritedDirection;
  const defaultClassNames = getDefaultClassNames();

  const navButtonClassName = cn(buttonVariants({ variant: buttonVariant, size: 'sm' }), 'w-control-sm px-0 aria-disabled:opacity-50');

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={isRTL ? ar : enUS}
      dir={direction}
      numerals="latn"
      labels={{
        labelPrevious: () => t('calendar.previousMonth'),
        labelNext: () => t('calendar.nextMonth'),
        // "Tuesday, October 27, 2026": the visible day number appears as a word (WCAG 2.5.3), in Western digits.
        labelDayButton: (date) =>
          new Intl.DateTimeFormat(`${isRTL ? 'ar' : 'en'}-u-nu-latn`, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(date),
        ...labels,
      }}
      className={cn(
        'bg-surface group/calendar p-3 [--cell-size:--spacing(8)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent',
        String.raw`[&[dir=rtl]_.rdp-button\_next>svg]:rotate-180`,
        String.raw`[&[dir=rtl]_.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString(isRTL ? 'ar' : 'en', { month: 'short', numberingSystem: 'latn' }),
        ...formatters,
      }}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn('relative flex flex-col gap-4 md:flex-row', defaultClassNames.months),
        month: cn('flex w-full flex-col gap-3', defaultClassNames.month),
        nav: cn('absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1', defaultClassNames.nav),
        button_previous: cn(navButtonClassName, defaultClassNames.button_previous),
        button_next: cn(navButtonClassName, defaultClassNames.button_next),
        month_caption: cn('flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)', defaultClassNames.month_caption),
        dropdowns: cn('flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium', defaultClassNames.dropdowns),
        dropdown_root: cn('relative', defaultClassNames.dropdown_root),
        dropdown: cn('absolute inset-0 opacity-0', defaultClassNames.dropdown),
        caption_label: cn(
          'text-fg font-semibold select-none',
          captionLayout === 'label'
            ? 'text-sm'
            : 'flex h-8 items-center gap-1 rounded-md ps-2 pe-1 text-sm [&>svg]:text-fg-muted [&>svg]:size-3.5',
          defaultClassNames.caption_label,
        ),
        month_grid: cn('w-full border-collapse', defaultClassNames.month_grid),
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn('text-fg-muted flex-1 text-xs font-normal select-none', defaultClassNames.weekday),
        week: cn('mt-1 flex w-full', defaultClassNames.week),
        week_number_header: cn('w-(--cell-size) select-none', defaultClassNames.week_number_header),
        week_number: cn('text-fg-muted text-xs select-none', defaultClassNames.week_number),
        day: cn('group/day relative size-(--cell-size) p-0 text-center select-none', defaultClassNames.day),
        range_start: cn('bg-accent-subtle rounded-s-md', defaultClassNames.range_start),
        range_middle: cn('bg-accent-subtle', defaultClassNames.range_middle),
        range_end: cn('bg-accent-subtle rounded-e-md', defaultClassNames.range_end),
        today: defaultClassNames.today,
        outside: cn('text-fg-muted', defaultClassNames.outside),
        disabled: cn('text-fg-subtle', defaultClassNames.disabled),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className: rootClassName, rootRef, ...rootProps }) => (
          <div data-slot="calendar" ref={mergeRefs(rootRef, rootElement)} className={cn(rootClassName)} {...rootProps} />
        ),
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) => {
          if (orientation === 'left') return <ChevronLeftIcon className={cn('size-4', chevronClassName)} {...chevronProps} />;
          if (orientation === 'right') return <ChevronRightIcon className={cn('size-4', chevronClassName)} {...chevronProps} />;
          return <ChevronDownIcon className={cn('size-4', chevronClassName)} {...chevronProps} />;
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...weekProps }) => (
          <td {...weekProps}>
            <div className="flex size-(--cell-size) items-center justify-center text-center">{children}</div>
          </td>
        ),
        MonthsDropdown: CalendarMonthsDropdown,
        YearsDropdown: CalendarYearsDropdown,
        ...components,
      }}
      {...props}
    />
  );
}

export default Calendar;
