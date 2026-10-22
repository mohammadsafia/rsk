'use client';

import { type ComponentProps, type ComponentPropsWithoutRef, type FC, type PropsWithChildren } from 'react';

import { cn } from '@utils';

export type CalendarTimeGridAxisRow = { label: string; isHourMark: boolean };

type SpacerProps = ComponentPropsWithoutRef<'div'>;

type HeaderProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
  dayName: string;
  dayNumber: number;
  isToday?: boolean;
};

type AxisProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
  rows: CalendarTimeGridAxisRow[];
  showStepLabels?: boolean;
};

type CellProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> & { available: boolean };

type EventCardProps = Omit<ComponentProps<'button'>, 'style'> & {
  top: number;
  height: number;
  left: number;
  width: number;
};

export type NowLineMode = 'in-range' | 'always' | 'off';

type NowLineProps = Omit<ComponentPropsWithoutRef<'div'>, 'style' | 'children'> & {
  percent: number;
  mode?: NowLineMode;
};

type ColumnProps = ComponentPropsWithoutRef<'div'> & { rowCount: number };

type CalendarTimeGridProps = PropsWithChildren;

type CalendarTimeGridComponents = FC<CalendarTimeGridProps> & {
  Spacer: FC<SpacerProps>;
  Header: FC<HeaderProps>;
  Axis: FC<AxisProps>;
  Cell: FC<CellProps>;
  EventCard: FC<EventCardProps>;
  NowLine: FC<NowLineProps>;
  Column: FC<ColumnProps>;
};

const Spacer: FC<SpacerProps> = ({ className, ...props }) => (
  <div
    aria-hidden="true"
    data-slot="calendar-time-grid-spacer"
    className={cn('bg-surface border-border-subtle w-16 shrink-0 border-y border-e', className)}
    {...props}
  />
);

const Header: FC<HeaderProps> = ({ dayName, dayNumber, isToday, className, ...props }) => (
  <div
    data-slot="calendar-time-grid-header"
    className={cn(
      'border-border-subtle bg-surface flex flex-1 items-center justify-center gap-1.5 border-y border-e px-2 py-2 last:border-e-0',
      className,
    )}
    {...props}
  >
    <span className={cn('text-xs font-medium uppercase', isToday ? 'text-accent' : 'text-fg-muted')}>{dayName}</span>

    <span className={cn('flex size-7 items-center justify-center text-sm tabular-nums', isToday ? 'text-accent font-semibold' : 'text-fg')}>
      {dayNumber}
    </span>
  </div>
);

const Axis: FC<AxisProps> = ({ rows, showStepLabels = false, className, style, ...props }) => (
  <div
    data-slot="calendar-time-grid-axis"
    className={cn('border-border-subtle bg-surface grid w-16 shrink-0 border-e', className)}
    style={{ gridTemplateRows: `repeat(${rows.length}, minmax(50px, 1fr))`, minHeight: `${rows.length * 50}px`, ...style }}
    {...props}
  >
    {rows.map((row, idx) => (
      <div key={idx} className="border-border-subtle flex items-start justify-end pe-2 pt-0.5 not-last:border-b">
        {(showStepLabels || row.isHourMark) && (
          <span className="text-fg-muted text-2xs tabular-nums">
            <bdi dir="ltr">{row.label}</bdi>
          </span>
        )}
      </div>
    ))}
  </div>
);

const Cell: FC<CellProps> = ({ available, className, ...props }) => (
  <div
    aria-hidden="true"
    data-slot="calendar-time-grid-cell"
    className={cn('border-border-subtle border-b last:border-b-0', available ? 'bg-surface' : 'bg-surface-sunken', className)}
    {...props}
  />
);

const EventCard: FC<EventCardProps> = ({ ref, top, height, left, width, className, type = 'button', ...props }) => (
  <button
    ref={ref}
    type={type}
    data-slot="calendar-time-grid-event-card"
    className={cn('focus-ring absolute z-20 flex cursor-pointer overflow-hidden rounded-md p-0.5 text-start', className)}
    style={{ top: `${top}%`, height: `${height}%`, insetInlineStart: `${left}%`, width: `${width}%` }}
    {...props}
  />
);

const NowLine: FC<NowLineProps> = ({ percent, mode = 'in-range', className, ...props }) => {
  if (mode === 'off') return null;
  if (mode === 'in-range' && (percent < 0 || percent > 100)) return null;

  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div
      aria-hidden="true"
      data-slot="calendar-time-grid-now-line"
      className={cn('bg-accent pointer-events-none absolute inset-x-0 z-30 h-px', className)}
      style={{ top: `${clamped}%` }}
      {...props}
    >
      <span className="bg-accent absolute -inset-s-1 -inset-bs-1 size-2 rounded-full" />
    </div>
  );
};

const Column: FC<ColumnProps> = ({ rowCount, className, style, children, ...props }) => (
  <div
    data-slot="calendar-time-grid-column"
    className={cn('relative grid flex-1', className)}
    style={{ gridTemplateRows: `repeat(${rowCount}, minmax(50px, 1fr))`, minHeight: `${rowCount * 50}px`, ...style }}
    {...props}
  >
    {children}
  </div>
);

const CalendarTimeGrid: CalendarTimeGridComponents = ({ children }) => <>{children}</>;

CalendarTimeGrid.Spacer = Spacer;
CalendarTimeGrid.Header = Header;
CalendarTimeGrid.Axis = Axis;
CalendarTimeGrid.Cell = Cell;
CalendarTimeGrid.EventCard = EventCard;
CalendarTimeGrid.NowLine = NowLine;
CalendarTimeGrid.Column = Column;

export default CalendarTimeGrid;
