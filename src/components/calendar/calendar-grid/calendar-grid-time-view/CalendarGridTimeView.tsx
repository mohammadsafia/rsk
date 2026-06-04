import { type FC, useMemo, useState } from 'react';

import { CalendarTimeGrid, type CalendarTimeGridAxisRow, Popover } from '@components/ui';
import { type CalendarAccessors, type EventTimeStatus, useCalendarGridContext } from '@components/calendar';

import { type DateInput, useDate } from '@hooks/shared';

type ParsedEvent<T> = {
  event: T;
  start: string;
  end: string;
  startMins: number;
  endMins: number;
};

type PlacedEvent<T> = {
  event: T;
  status: EventTimeStatus;
  top: number;
  height: number;
  left: number;
  width: number;
  isOverflow: boolean;
};

type PlaceEventsParams<T> = {
  events: T[];
  accessors: CalendarAccessors<T>;
  startHour: number;
  endHour: number;
  dayKey: string;
  isoFor: (date: DateInput) => string;
  now: DateInput;
  toMinutes: (date: DateInput) => number;
  isBefore: (a: DateInput, b: DateInput) => boolean;
  isAfter: (a: DateInput, b: DateInput) => boolean;
};

type EventSlotProps = {
  placement: PlacedEvent<unknown>;
};

type CalendarGridTimeViewComponents = FC & {
  DayView: FC;
  WeekView: FC;
};

const MAX_VISIBLE_COLUMNS = 4;
const MIN_HEIGHT_PERCENT = 2;

const parseTimeMinutes = (time: string): number => {
  const [hStr, mStr] = time.split(':');
  return Number(hStr) * 60 + Number(mStr ?? 0);
};

const computeRowCount = (startHour: number, endHour: number, stepMinutes: number): number => {
  const totalMinutes = (endHour - startHour) * 60;
  return Math.max(Math.floor(totalMinutes / stepMinutes), 1);
};

function parseEventsForDay<T>(
  events: T[],
  accessors: CalendarAccessors<T>,
  dayKey: string,
  isoFor: (date: DateInput) => string,
  toMinutes: (date: DateInput) => number,
  startMinutes: number,
  endMinutes: number,
): ParsedEvent<T>[] {
  return events
    .filter((event) => isoFor(accessors.getStartTime(event)) === dayKey)
    .map((event) => {
      const start = accessors.getStartTime(event);
      const end = accessors.getEndTime(event);
      const rawStart = toMinutes(start);
      const rawEnd = toMinutes(end);

      return {
        event,
        start,
        end,
        startMins: Math.max(rawStart, startMinutes),
        endMins: rawEnd === rawStart ? rawStart + 1 : Math.min(rawEnd, endMinutes),
      };
    })
    .sort((a, b) => a.startMins - b.startMins || b.endMins - b.startMins - (a.endMins - a.startMins));
}

function clusterEvents<T>(parsed: ParsedEvent<T>[]): ParsedEvent<T>[][] {
  const clusters: ParsedEvent<T>[][] = [];
  const visited = new Set<number>();

  for (let i = 0; i < parsed.length; i++) {
    if (visited.has(i)) continue;

    const cluster = [parsed[i]];
    visited.add(i);
    let clusterEnd = parsed[i].endMins;

    for (let j = i + 1; j < parsed.length; j++) {
      if (visited.has(j)) continue;
      if (parsed[j].startMins < clusterEnd) {
        cluster.push(parsed[j]);
        visited.add(j);
        clusterEnd = Math.max(clusterEnd, parsed[j].endMins);
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

function placeCluster<T>(
  cluster: ParsedEvent<T>[],
  startMinutes: number,
  totalMinutes: number,
  now: DateInput,
  isBefore: (a: DateInput, b: DateInput) => boolean,
  isAfter: (a: DateInput, b: DateInput) => boolean,
): PlacedEvent<T>[] {
  const columnMap = new Map<number, ParsedEvent<T>[]>();
  const result: PlacedEvent<T>[] = [];

  for (const item of cluster) {
    let col = 0;

    for (; ; col++) {
      const colEvents = columnMap.get(col) ?? [];
      if (!colEvents.some((e) => item.startMins < e.endMins && item.endMins > e.startMins)) break;
    }

    if (!columnMap.has(col)) columnMap.set(col, []);
    columnMap.get(col)!.push(item);

    let maxConcurrent = 0;
    for (const other of cluster) {
      if (item.startMins < other.endMins && item.endMins > other.startMins) maxConcurrent++;
    }

    const effectiveColumns = Math.min(maxConcurrent, MAX_VISIBLE_COLUMNS);
    const isOverflow = col >= MAX_VISIBLE_COLUMNS;

    result.push({
      event: item.event,
      status: isBefore(item.end, now) ? 'past' : isAfter(item.start, now) ? 'future' : 'current',
      top: ((item.startMins - startMinutes) / totalMinutes) * 100,
      height: Math.max(((item.endMins - item.startMins) / totalMinutes) * 100, MIN_HEIGHT_PERCENT),
      left: isOverflow ? 0 : col * (100 / effectiveColumns),
      width: isOverflow ? 0 : 100 / effectiveColumns,
      isOverflow,
    });
  }

  return result;
}

function placeEvents<T>({
  events,
  accessors,
  startHour,
  endHour,
  dayKey,
  isoFor,
  now,
  toMinutes,
  isBefore,
  isAfter,
}: PlaceEventsParams<T>): PlacedEvent<T>[] {
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;
  const totalMinutes = endMinutes - startMinutes;

  const parsed = parseEventsForDay(events, accessors, dayKey, isoFor, toMinutes, startMinutes, endMinutes);
  const clusters = clusterEvents(parsed);

  return clusters.flatMap((cluster) => placeCluster(cluster, startMinutes, totalMinutes, now, isBefore, isAfter));
}

const DayHeader: FC<{ day: DateInput }> = ({ day }) => {
  const { formatDate, toDate, constants } = useDate();
  const isToday = toDate(day) === toDate();
  const dayName = formatDate(day, constants.DateFormats.SHORT_DAY).toUpperCase();
  const dayNumber = Number(formatDate(day, constants.DateFormats.DAY_OF_MONTH));

  return <CalendarTimeGrid.Header dayName={dayName} dayNumber={dayNumber} isToday={isToday} />;
};

const TimeAxis: FC = () => {
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
        label: isHourMark ? formatHour(hour, constants.TimeFormats.HOUR_MINUTES_12) : '',
        isHourMark,
      });
    }

    return items;
  }, [startHour, endHour, stepMinutes, formatHour, constants]);

  return <CalendarTimeGrid.Axis rows={rows} showStepLabels={showStepLabels} />;
};

const EventSlot: FC<EventSlotProps> = ({ placement }) => {
  const { renderEvent, popoverContent } = useCalendarGridContext();
  const [open, setOpen] = useState(false);

  const trigger = (
    <CalendarTimeGrid.EventCard
      top={placement.top}
      height={placement.height}
      left={placement.left}
      width={placement.width}
      onClick={popoverContent ? () => setOpen(true) : undefined}
    >
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

const DayColumn: FC<{ day: DateInput; className?: string }> = ({ day, className }) => {
  const { events, eventAccessors, slots, startHour, endHour, stepMinutes } = useCalendarGridContext();
  const { toDate, toDateUnits, isBefore, isAfter } = useDate();

  const dayKey = toDate(day);
  const rowCount = computeRowCount(startHour, endHour, stepMinutes);

  const cells = useMemo(() => {
    const slotRanges = (slots?.[dayKey] ?? []).map((s) => ({
      start: parseTimeMinutes(s.startTime),
      end: parseTimeMinutes(s.endTime),
    }));

    return Array.from({ length: rowCount }, (_, idx) => {
      const cellStart = startHour * 60 + idx * stepMinutes;
      const cellEnd = cellStart + stepMinutes;
      const isAvailable = slotRanges.some((r) => cellStart < r.end && cellEnd > r.start);

      return { isAvailable };
    });
  }, [slots, dayKey, rowCount, startHour, stepMinutes]);

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
      dayKey,
      isoFor: toDate,
      now: toDate(),
      toMinutes,
      isBefore,
      isAfter,
    });
  }, [events, eventAccessors, startHour, endHour, dayKey, toDate, toDateUnits, isBefore, isAfter]);

  return (
    <CalendarTimeGrid.Column rowCount={rowCount} className={className}>
      <NowIndicator day={day} />

      {placements.map((placement, idx) => (
        <EventSlot key={`${eventAccessors.getId(placement.event)}-${idx}`} placement={placement} />
      ))}

      {cells.map((cell, idx) => (
        <CalendarTimeGrid.Cell key={idx} available={cell.isAvailable} />
      ))}
    </CalendarTimeGrid.Column>
  );
};

const DayView: FC = () => {
  const { view, viewMode, date } = useCalendarGridContext();

  if (view !== 'day' || viewMode !== 'calendar') return null;

  return (
    <div data-slot="calendar-grid-day-view" className="flex min-h-0 flex-1 flex-col">
      <div
        data-slot="calendar-grid-header-row"
        className="flex shrink-0 overflow-y-scroll [scrollbar-color:var(--color-muted-50)_var(--color-muted-50)] [scrollbar-gutter:stable] [scrollbar-width:thin]"
      >
        <CalendarTimeGrid.Spacer />

        <DayHeader day={date} />
      </div>

      <div
        data-slot="calendar-grid-body-row"
        className="flex min-h-128 flex-1 overflow-y-auto [scrollbar-color:var(--color-muted-200)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin]"
      >
        <TimeAxis />

        <DayColumn day={date} />
      </div>
    </div>
  );
};

const WeekView: FC = () => {
  const { view, viewMode, range } = useCalendarGridContext();

  const { addDuration, toDate, constants } = useDate();

  const days = useMemo(() => {
    const result: string[] = [];
    let current = range.startDate;

    for (let i = 0; i < 7; i++) {
      result.push(current);

      current = addDuration(current, 1, constants.UnitOfTime.DAY);
    }

    return result;
  }, [range.startDate, addDuration, constants]);

  if (view !== 'week' || viewMode !== 'calendar') return null;

  return (
    <div data-slot="calendar-grid-week-view" className="flex min-h-0 flex-1 flex-col">
      <div
        data-slot="calendar-grid-header-row"
        className="flex shrink-0 overflow-y-scroll [scrollbar-color:var(--color-muted-50)_var(--color-muted-50)] [scrollbar-gutter:stable] [scrollbar-width:thin]"
      >
        <CalendarTimeGrid.Spacer />

        <div data-slot="calendar-grid-day-headers" className="flex flex-1">
          {days.map((day) => (
            <DayHeader key={toDate(day)} day={day} />
          ))}
        </div>
      </div>

      <div
        data-slot="calendar-grid-body-row"
        className="flex min-h-128 flex-1 overflow-y-auto [scrollbar-color:var(--color-muted-200)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin]"
      >
        <TimeAxis />

        {days.map((day) => (
          <DayColumn key={toDate(day)} day={day} className="border-muted-200 border-e last:border-e-0" />
        ))}
      </div>
    </div>
  );
};

const CalendarGridTimeView: CalendarGridTimeViewComponents = () => null;

CalendarGridTimeView.DayView = DayView;
CalendarGridTimeView.WeekView = WeekView;

export default CalendarGridTimeView;
