'use client';

import { type ComponentProps, type ComponentPropsWithoutRef, type FC } from 'react';

import { cn } from '@utils';

type WeekdaysProps = ComponentPropsWithoutRef<'div'>;

type WeekdayProps = ComponentPropsWithoutRef<'div'>;

type DaysProps = ComponentPropsWithoutRef<'div'>;

type DayCellProps = ComponentPropsWithoutRef<'div'> & {
  dayNumber: number;
  isToday?: boolean;
  isCurrentMonth: boolean;
  available: boolean;
};

type EventChipProps = ComponentProps<'button'>;

type CalendarMonthGridProps = ComponentPropsWithoutRef<'div'>;

type CalendarMonthGridComponents = FC<CalendarMonthGridProps> & {
  Weekdays: FC<WeekdaysProps>;
  Weekday: FC<WeekdayProps>;
  Days: FC<DaysProps>;
  DayCell: FC<DayCellProps>;
  EventChip: FC<EventChipProps>;
};

const Weekdays: FC<WeekdaysProps> = ({ className, ...props }) => (
  <div
    data-slot="calendar-month-grid-weekdays"
    className={cn('border-border-subtle bg-surface grid grid-cols-7 border-b', className)}
    {...props}
  />
);

const Weekday: FC<WeekdayProps> = ({ className, ...props }) => (
  <div
    data-slot="calendar-month-grid-weekday"
    className={cn('text-fg-muted border-border-subtle border-e py-2 text-center text-xs font-medium last:border-e-0', className)}
    {...props}
  />
);

const Days: FC<DaysProps> = ({ className, ...props }) => (
  <div
    data-slot="calendar-month-grid-days"
    className={cn(
      'grid flex-1 auto-rows-fr grid-cols-7',
      '[&>[data-slot=calendar-month-grid-day-cell]:nth-child(7n)]:border-e-0',
      '[&>[data-slot=calendar-month-grid-day-cell]:nth-last-child(-n+7)]:border-b-0',
      className,
    )}
    {...props}
  />
);

const DayCell: FC<DayCellProps> = ({ dayNumber, isToday, isCurrentMonth, available, className, children, ...props }) => (
  <div
    data-slot="calendar-month-grid-day-cell"
    {...(isToday ? { 'aria-current': 'date' as const } : {})}
    className={cn(
      'border-border-subtle flex min-h-25 flex-col overflow-hidden border-e border-b p-1',
      !available && 'bg-surface-sunken',
      className,
    )}
    {...props}
  >
    <span
      className={cn(
        'mb-1 flex size-6 items-center justify-center rounded-md text-xs tabular-nums',
        isToday && 'text-accent font-semibold',
        !isToday && isCurrentMonth && 'text-fg',
        !isToday && !isCurrentMonth && 'text-fg-muted',
      )}
    >
      {dayNumber}
    </span>

    <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">{children}</div>
  </div>
);

const EventChip: FC<EventChipProps> = ({ ref, className, type = 'button', ...props }) => (
  <button
    ref={ref}
    type={type}
    data-slot="calendar-month-grid-event-chip"
    className={cn('focus-ring block w-full cursor-pointer overflow-hidden rounded-md text-start', className)}
    {...props}
  />
);

const CalendarMonthGrid: CalendarMonthGridComponents = ({ className, ...props }) => (
  <div
    data-slot="calendar-month-grid"
    className={cn(
      'flex min-h-0 flex-1 flex-col overflow-y-auto',
      '[scrollbar-color:var(--color-border-strong)_transparent] [scrollbar-width:thin]',
      className,
    )}
    {...props}
  />
);

CalendarMonthGrid.Weekdays = Weekdays;
CalendarMonthGrid.Weekday = Weekday;
CalendarMonthGrid.Days = Days;
CalendarMonthGrid.DayCell = DayCell;
CalendarMonthGrid.EventChip = EventChip;

export default CalendarMonthGrid;
