import { type FC, type ReactNode, useMemo, useState } from 'react';

import { Conditional } from '@components/utils';
import { Avatar, CalendarTimeGrid, type CalendarTimeGridAxisRow, Popover } from '@components/ui';
import { type CalendarResource, useCalendarGridContext } from '@components/calendar';

import { type DateInput, useDate } from '@hooks/shared';

import { cn } from '@utils';

import { dayKeyOf, slotRangesFor } from '../scheduling';
import AllDayRow from './AllDayRow';
import { isAllDayEvent, type PlacedEvent, placeEvents } from './placement';

export type GridColumn = { key: string; dayKey: string; resourceId?: string };

type EventSlotProps = {
  placement: PlacedEvent<unknown>;
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
  const { formatDate, toDate, constants } = useDate();
  const isToday = toDate(day) === toDate();
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

const EventSlot: FC<EventSlotProps> = ({ placement }) => {
  const { renderEvent, popoverContent, eventAccessors } = useCalendarGridContext();
  const { formatNullableDate, constants } = useDate();
  const [open, setOpen] = useState(false);
  const day = formatNullableDate(eventAccessors.getStartTime(placement.event), constants.DateFormats.FULL_MONTH_DAY_YEAR, '');

  const trigger = (
    <CalendarTimeGrid.EventCard
      top={placement.top}
      height={placement.height}
      left={placement.left}
      width={placement.width}
      onClick={popoverContent ? () => setOpen(true) : undefined}
    >
      <Conditional.If condition={!!day}>
        <span className="sr-only">{`${day}, `}</span>
      </Conditional.If>

      {renderEvent(placement.event, placement.status)}
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

const NowIndicator: FC<{ day: DateInput }> = ({ day }) => {
  const { startHour, endHour, nowLine } = useCalendarGridContext();
  const { toDate, toDateUnits } = useDate();

  if (toDate(day) !== toDate()) return null;

  const { hours, minutes } = toDateUnits();
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
  const { events, eventAccessors, slots, startHour, endHour, stepMinutes } = useCalendarGridContext();
  const { toDate, toDateUnits, isBefore, isAfter } = useDate();

  const { dayKey, resourceId } = column;
  const rowCount = computeRowCount(startHour, endHour, stepMinutes);

  const cells = useMemo(() => {
    const ranges = slotRangesFor(slots, dayKey, resourceId) ?? [];

    return Array.from({ length: rowCount }, (_, idx) => {
      const cellStart = startHour * 60 + idx * stepMinutes;
      const cellEnd = cellStart + stepMinutes;

      return { isAvailable: ranges.some((range) => cellStart < range.end && cellEnd > range.start) };
    });
  }, [slots, dayKey, resourceId, rowCount, startHour, stepMinutes]);

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
      now: toDate(),
      toMinutes,
      isBefore,
      isAfter,
    });
  }, [events, eventAccessors, startHour, endHour, dayKey, resourceId, toDate, toDateUnits, isBefore, isAfter]);

  return (
    <CalendarTimeGrid.Column
      rowCount={rowCount}
      data-calendar-column=""
      data-column-index={index}
      data-day={dayKey}
      data-resource={resourceId}
      className={cn('border-border-subtle border-e last:border-e-0', wide ? 'min-w-44' : 'min-w-0')}
    >
      <NowIndicator day={dayKey} />

      {placements.map((placement, idx) => (
        <EventSlot key={`${eventAccessors.getId(placement.event)}-${idx}`} placement={placement} />
      ))}

      {cells.map((cell, idx) => (
        <CalendarTimeGrid.Cell key={idx} available={cell.isAvailable} />
      ))}
    </CalendarTimeGrid.Column>
  );
};

/** Shared layout of the day and week views: one scroller with a sticky header row and a sticky time axis. */
/** `wide`: resource columns keep a readable width and scroll horizontally instead of squeezing. */
const TimeGrid: FC<{ slot: string; columns: GridColumn[]; headers: ReactNode; wide?: boolean }> = ({
  slot,
  columns,
  headers,
  wide = false,
}) => (
  <div data-slot={slot} className="flex min-h-0 flex-1 flex-col">
    <div
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
);

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
