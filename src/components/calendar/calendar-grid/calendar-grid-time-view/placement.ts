import type { CalendarAccessors, EventTimeStatus } from '../CalendarGrid';
import { spansDays } from '../scheduling';

import type { DateInput } from '@hooks/shared';

type ParsedEvent<T> = {
  event: T;
  start: string;
  end: string;
  startMins: number;
  endMins: number;
};

export type PlacedEvent<T> = {
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
  belongs: (event: T) => boolean;
  now: DateInput;
  toMinutes: (date: DateInput) => number;
  isBefore: (a: DateInput, b: DateInput) => boolean;
  isAfter: (a: DateInput, b: DateInput) => boolean;
};

const MAX_VISIBLE_COLUMNS = 4;
const MIN_HEIGHT_PERCENT = 2;

/** Flagged all-day, or spanning midnight / several days: these render in the all-day row, not the time grid. */
export const isAllDayEvent = <T>(event: T, accessors: CalendarAccessors<T>) =>
  !!accessors.isAllDay?.(event) || spansDays(accessors.getStartTime(event), accessors.getEndTime(event));

function parseEvents<T>(
  events: T[],
  accessors: CalendarAccessors<T>,
  belongs: (event: T) => boolean,
  toMinutes: (date: DateInput) => number,
  startMinutes: number,
  endMinutes: number,
): ParsedEvent<T>[] {
  return events
    .filter(belongs)
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

/** Overlap lanes for the events of one column (a day, or a day for one resource). */
export function placeEvents<T>({
  events,
  accessors,
  startHour,
  endHour,
  belongs,
  now,
  toMinutes,
  isBefore,
  isAfter,
}: PlaceEventsParams<T>): PlacedEvent<T>[] {
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;
  const totalMinutes = endMinutes - startMinutes;

  const parsed = parseEvents(events, accessors, belongs, toMinutes, startMinutes, endMinutes);

  return clusterEvents(parsed).flatMap((cluster) => placeCluster(cluster, startMinutes, totalMinutes, now, isBefore, isAfter));
}
