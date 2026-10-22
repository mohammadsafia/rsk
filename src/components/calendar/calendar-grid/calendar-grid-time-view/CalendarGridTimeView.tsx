'use client';

import { type FC, type ReactNode, useMemo, useRef, useState } from 'react';

import { Conditional } from '@components/utils';
import { Avatar, CalendarTimeGrid, type CalendarTimeGridAxisRow, Popover } from '@components/ui';
import { type CalendarResource, useCalendarGridContext } from '@components/calendar';

import { useTravel } from '@hooks/motion';
import { type DateInput, useAppTranslation, useDate } from '@hooks/shared';

import { cn } from '@utils';

import { dayKeyOf, slotRangesFor } from '../scheduling';
import AllDayRow from './AllDayRow';
import { isAllDayEvent, type PlacedEvent, placeEvents } from './placement';
import { TimeGridGestureContext, useTimeGridGestureContext, useTimeGridGestures } from './useTimeGridGestures';

export type GridColumn = { key: string; dayKey: string; resourceId?: string };

type EventSlotProps = {
  placement: PlacedEvent<unknown>;
  columnIndex: number;
};

type CalendarGridTimeViewComponents = FC & {
  DayView: FC;
  WeekView: FC;
};

const computeRowCount = (startHour: number, endHour: number, stepMinutes: number): number => {
  const totalMinutes = (endHour - startHour) * 60;
  return Math.max(Math.floor(totalMinutes / stepMinutes), 1);
};

const DayHeader: FC<{ day: DateInput }> = ({ day }) => {
  const { now } = useCalendarGridContext();
  const { formatDate, toDate, constants } = useDate();
  const isToday = toDate(day) === toDate(now);
  const dayName = formatDate(day, constants.DateFormats.SHORT_DAY).toUpperCase();
  const dayNumber = Number(formatDate(day, constants.DateFormats.DAY_OF_MONTH));

  return <CalendarTimeGrid.Header dayName={dayName} dayNumber={dayNumber} isToday={isToday} />;
};

const TimeAxis: FC<{ className?: string }> = ({ className }) => {
  const { startHour, endHour, stepMinutes, showStepLabels } = useCalendarGridContext();
  const { formatHour, constants } = useDate();

  const rows = useMemo<CalendarTimeGridAxisRow[]>(() => {
    const items: CalendarTimeGridAxisRow[] = [];
    const totalMinutes = (endHour - startHour) * 60;

    for (let m = 0; m < totalMinutes; m += stepMinutes) {
      const hour = Math.floor(m / 60) + startHour;
      const min = m % 60;
      const isHourMark = min === 0;

      items.push({
        label: isHourMark ? formatHour(hour, constants.TimeFormats.HOUR_12) : '',
        isHourMark,
      });
    }

    return items;
  }, [startHour, endHour, stepMinutes, formatHour, constants]);

  return <CalendarTimeGrid.Axis rows={rows} showStepLabels={showStepLabels} className={className} />;
};

const EventSlot: FC<EventSlotProps> = ({ placement, columnIndex }) => {
  const { renderEvent, popoverContent, eventAccessors, isEditable } = useCalendarGridContext();
  const gestures = useTimeGridGestureContext();
  const { formatNullableDate, constants } = useDate();
  const [open, setOpen] = useState(false);
  const day = formatNullableDate(eventAccessors.getStartTime(placement.event), constants.DateFormats.FULL_MONTH_DAY_YEAR, '');
  const id = eventAccessors.getId(placement.event);
  const editable = isEditable(placement.event);
  const dragging = gestures.draft?.eventId === id;

  const trigger = (
    <CalendarTimeGrid.EventCard
      top={placement.top}
      height={placement.height}
      left={placement.left}
      width={placement.width}
      data-event-id={id}
      className={cn(editable && 'touch-none', dragging && 'opacity-50')}
      aria-keyshortcuts={editable ? 'M R' : undefined}
      onPointerDown={(event) => gestures.onEventPointerDown(event, placement.event, columnIndex)}
      onKeyDown={(event) => gestures.onEventKeyDown(event, placement.event, columnIndex)}
      onBlur={() => gestures.onEventBlur(placement.event)}
      onClick={(event) => {
        // The click that ends a drag must not open the popover (preventDefault also stops Radix's trigger).
        if (gestures.shouldSuppressClick()) {
          event.preventDefault();
          return;
        }
        if (popoverContent) setOpen(true);
      }}
    >
      <Conditional.If condition={!!day}>
        <span className="sr-only">{`${day}, `}</span>
      </Conditional.If>

      {renderEvent(placement.event, placement.status)}

      {editable ? <span data-resize-handle="" aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize" /> : null}
    </CalendarTimeGrid.EventCard>
  );

  if (!popoverContent) return trigger;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>

      <Popover.Content className="w-80 p-0">{popoverContent(placement.event, () => setOpen(false))}</Popover.Content>
    </Popover>
  );
};

/** The range being drawn or the target of a move/resize, with a live time label. */
const DraftGhost: FC<{ columnIndex: number }> = ({ columnIndex }) => {
  const { startHour, endHour } = useCalendarGridContext();
  const { draft, label } = useTimeGridGestureContext();

  if (!draft || draft.columnIndex !== columnIndex) return null;

  const total = (endHour - startHour) * 60;
  const percent = (minutes: number) => ((minutes - startHour * 60) / total) * 100;

  return (
    <div
      data-slot="calendar-grid-draft"
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-x-1 z-30 flex items-start overflow-hidden rounded-md border px-1.5 py-0.5',
        draft.allowed ? 'border-accent bg-accent-subtle text-accent' : 'border-danger bg-danger-subtle text-danger',
      )}
      style={{ top: `${percent(draft.start)}%`, height: `${percent(draft.end) - percent(draft.start)}%` }}
    >
      <span className="text-2xs font-medium tabular-nums">
        <bdi dir="ltr">{label(columnIndex, draft.start, draft.end)}</bdi>
      </span>
    </div>
  );
};

const NowIndicator: FC<{ day: DateInput }> = ({ day }) => {
  const { startHour, endHour, nowLine, now } = useCalendarGridContext();
  const { toDate, toDateUnits } = useDate();

  if (toDate(day) !== toDate(now)) return null;

  const { hours, minutes } = toDateUnits(now);
  const currentMinutes = hours * 60 + minutes;
  const totalMinutes = (endHour - startHour) * 60;
  const percent = ((currentMinutes - startHour * 60) / totalMinutes) * 100;

  return <CalendarTimeGrid.NowLine percent={percent} mode={nowLine} />;
};

const initials = (label: string) =>
  label
    .replace(/^(dr|mr|mrs|ms)\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const ResourceHeader: FC<{ resource: CalendarResource }> = ({ resource }) => (
  <div
    data-slot="calendar-grid-resource-header"
    className="border-border-subtle bg-surface flex min-w-44 flex-1 items-center justify-center gap-2 border-y border-e px-2 py-2 last:border-e-0"
  >
    <Avatar size="sm">
      {resource.avatar ? <Avatar.Image src={resource.avatar} alt="" /> : <></>}
      <Avatar.Fallback>{initials(resource.label)}</Avatar.Fallback>
    </Avatar>

    <span className="text-fg truncate text-sm font-medium">{resource.label}</span>
  </div>
);

const DayColumn: FC<{ column: GridColumn; index: number; wide: boolean }> = ({ column, index, wide }) => {
  const { t } = useAppTranslation('common');
  const { events, eventAccessors, slots, startHour, endHour, stepMinutes, onSlotSelect, now: clock } = useCalendarGridContext();
  const gestures = useTimeGridGestureContext();
  const { toDate, toDateUnits, isBefore, isAfter } = useDate();

  const { dayKey, resourceId } = column;
  const rowCount = computeRowCount(startHour, endHour, stepMinutes);

  const cells = useMemo(() => {
    const ranges = slotRangesFor(slots, dayKey, resourceId);

    return Array.from({ length: rowCount }, (_, idx) => {
      const cellStart = startHour * 60 + idx * stepMinutes;
      const cellEnd = cellStart + stepMinutes;

      // Without availability data a selectable grid is open everywhere; a read-only one keeps today's sunken look.
      if (ranges === null) return { isAvailable: !!onSlotSelect };

      return { isAvailable: ranges.some((range) => cellStart < range.end && cellEnd > range.start) };
    });
  }, [slots, dayKey, resourceId, rowCount, startHour, stepMinutes, onSlotSelect]);

  const placements = useMemo(() => {
    const toMinutes = (input: DateInput): number => {
      const { hours, minutes } = toDateUnits(input);
      return hours * 60 + minutes;
    };

    return placeEvents({
      events,
      accessors: eventAccessors,
      startHour,
      endHour,
      belongs: (event) =>
        dayKeyOf(eventAccessors.getStartTime(event)) === dayKey &&
        (resourceId === undefined || eventAccessors.getResourceId?.(event) === resourceId) &&
        !isAllDayEvent(event, eventAccessors),
      now: toDate(clock),
      toMinutes,
      isBefore,
      isAfter,
    });
  }, [events, eventAccessors, startHour, endHour, dayKey, resourceId, clock, toDate, toDateUnits, isBefore, isAfter]);

  return (
    <CalendarTimeGrid.Column
      rowCount={rowCount}
      data-calendar-column=""
      data-column-index={index}
      data-day={dayKey}
      data-resource={resourceId}
      className={cn('border-border-subtle border-e last:border-e-0', wide ? 'min-w-44' : 'min-w-0')}
      onPointerDown={(event) => gestures.onColumnPointerDown(event, index)}
    >
      <NowIndicator day={dayKey} />

      {placements.map((placement, idx) => (
        <EventSlot key={`${eventAccessors.getId(placement.event)}-${idx}`} placement={placement} columnIndex={index} />
      ))}

      <DraftGhost columnIndex={index} />

      {cells.map((cell, idx) => {
        if (!onSlotSelect) return <CalendarTimeGrid.Cell key={idx} available={cell.isAvailable} />;

        // Selectable cells: a roving tab stop, arrow keys between cells, Enter selects one step.
        const start = startHour * 60 + idx * stepMinutes;
        const allowed = gestures.isAllowed(index, start, start + stepMinutes);
        const stop = gestures.tabStop();
        const label = gestures.describe(index, start);

        return (
          <CalendarTimeGrid.Cell
            key={idx}
            available={cell.isAvailable}
            aria-hidden={undefined}
            role="button"
            data-cell-row={idx}
            tabIndex={stop.column === index && stop.row === idx ? 0 : -1}
            aria-label={allowed ? label : `${label}, ${t('calendar.unavailable')}`}
            aria-disabled={allowed ? undefined : true}
            className="focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
            onFocus={() => gestures.setFocusedCell({ column: index, row: idx })}
            onKeyDown={(event) => gestures.onCellKeyDown(event, index, idx)}
          />
        );
      })}
    </CalendarTimeGrid.Column>
  );
};

/** Shared layout of the day and week views: one scroller with a sticky header row and a sticky time axis. */
/**
 * Shared layout of the day and week views: one scroller with a sticky header row and a sticky time axis.
 * `wide`: resource columns keep a readable width and scroll horizontally instead of squeezing.
 */
const TimeGrid: FC<{ slot: string; columns: GridColumn[]; headers: ReactNode; wide?: boolean }> = ({
  slot,
  columns,
  headers,
  wide = false,
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const gestures = useTimeGridGestures(columns, scrollerRef);
  const { view, range } = useCalendarGridContext();
  const bodyRef = useRef<HTMLDivElement>(null);
  useTravel(bodyRef, range.startDate, view);

  return (
    <TimeGridGestureContext.Provider value={gestures}>
      <div ref={bodyRef} data-slot={slot} className="flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollerRef}
          data-slot="calendar-grid-body"
          className="relative min-h-128 flex-1 [scrollbar-width:thin] [scrollbar-color:var(--color-border-strong)_transparent] overflow-auto"
        >
          <div className="flex w-max min-w-full flex-col">
            <div data-slot="calendar-grid-header-row" className="bg-surface sticky top-0 z-40 flex flex-col">
              <div className="flex">
                <CalendarTimeGrid.Spacer className="sticky start-0 z-10" />

                <div data-slot="calendar-grid-day-headers" className="flex flex-1">
                  {headers}
                </div>
              </div>

              <AllDayRow columns={columns} resourceMode={wide} />
            </div>

            <div data-slot="calendar-grid-body-row" className="flex flex-1">
              <TimeAxis className="sticky start-0 z-30" />

              {columns.map((column, index) => (
                <DayColumn key={column.key} column={column} index={index} wide={wide} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </TimeGridGestureContext.Provider>
  );
};

const DayView: FC = () => {
  const { view, viewMode, date, resources } = useCalendarGridContext();

  const columns = useMemo<GridColumn[]>(
    () =>
      resources.length > 0
        ? resources.map((resource) => ({ key: `${date}:${resource.id}`, dayKey: date, resourceId: resource.id }))
        : [{ key: date, dayKey: date }],
    [resources, date],
  );

  if (view !== 'day' || viewMode !== 'calendar') return null;

  const headers =
    resources.length > 0 ? resources.map((resource) => <ResourceHeader key={resource.id} resource={resource} />) : <DayHeader day={date} />;

  return <TimeGrid slot="calendar-grid-day-view" columns={columns} headers={headers} wide={resources.length > 0} />;
};

const WeekView: FC = () => {
  const { view, viewMode, range, resourceFilter } = useCalendarGridContext();

  const { addDuration, toDate, constants } = useDate();

  const days = useMemo(() => {
    const result: string[] = [];
    let current = range.startDate;

    for (let i = 0; i < 7; i++) {
      result.push(toDate(current));

      current = addDuration(current, 1, constants.UnitOfTime.DAY);
    }

    return result;
  }, [range.startDate, addDuration, toDate, constants]);

  const columns = useMemo<GridColumn[]>(
    () => days.map((day) => ({ key: day, dayKey: day, resourceId: resourceFilter ?? undefined })),
    [days, resourceFilter],
  );

  if (view !== 'week' || viewMode !== 'calendar') return null;

  return (
    <TimeGrid
      slot="calendar-grid-week-view"
      columns={columns}
      headers={days.map((day) => (
        <DayHeader key={day} day={day} />
      ))}
    />
  );
};

const CalendarGridTimeView: CalendarGridTimeViewComponents = () => null;

CalendarGridTimeView.DayView = DayView;
CalendarGridTimeView.WeekView = WeekView;

export default CalendarGridTimeView;
