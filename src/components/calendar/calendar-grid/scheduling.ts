import { format, parseISO } from 'date-fns';

/** A press that moves less than this is a click. */
export const DRAG_THRESHOLD_PX = 4;

export type MinuteRange = { start: number; end: number };
export type SlotRange = { startTime: string; endTime: string };
export type CalendarSlots = Record<string, SlotRange[]> | Record<string, Record<string, SlotRange[]>>;

const DAY_KEY = 'yyyy-MM-dd';

const toLocal = (input: string): Date => (/^\d{4}-\d{2}-\d{2}$/.test(input) ? parseISO(input) : new Date(input));

const fromDayKey = (dayKey: string, minutes = 0): Date => {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day, 0, minutes);
};

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const snapMinutes = (minutes: number, step: number, mode: 'round' | 'floor' = 'round') =>
  (mode === 'floor' ? Math.floor(minutes / step) : Math.round(minutes / step)) * step;

/** Minute of the day under a pointer `offset` px below the top of a column `height` px tall spanning startHour..endHour. */
export const offsetToMinutes = (offset: number, height: number, startHour: number, endHour: number) => {
  const ratio = height > 0 ? clamp(offset / height, 0, 1) : 1;
  return startHour * 60 + ratio * (endHour - startHour) * 60;
};

/** Index of the column whose rect contains `clientX`; DOM rects already reflect RTL order. */
export const columnAt = (clientX: number, rects: { left: number; right: number }[]) =>
  rects.findIndex((rect) => clientX >= rect.left && clientX < rect.right);

export const minuteOfDay = (input: string) => {
  const date = toLocal(input);
  return date.getHours() * 60 + date.getMinutes();
};

export const dayKeyOf = (input: string) => format(toLocal(input), DAY_KEY);

/** End minute measured from the start's day: an end at the next midnight is 1440, not 0. */
export const endMinuteOf = (start: string, end: string) => (dayKeyOf(end) > dayKeyOf(start) ? 24 * 60 : 0) + minuteOfDay(end);

/** The last day an event touches; an end exactly at midnight belongs to the day before. */
export const lastDayKeyOf = (start: string, end: string) => {
  const startDate = toLocal(start);
  const endDate = toLocal(end);
  if (endDate <= startDate) return format(startDate, DAY_KEY);
  return format(new Date(endDate.getTime() - 1), DAY_KEY);
};

export const spansDays = (start: string, end: string) => lastDayKeyOf(start, end) !== dayKeyOf(start);

/**
 * Local wall time `minutes` after midnight on `dayKey`, as an offset ISO string. Built from wall-clock parts (never by
 * adding milliseconds), so a DST change on that day doesn't shift it.
 */
export const wallTime = (dayKey: string, minutes: number) => format(fromDayKey(dayKey, minutes), "yyyy-MM-dd'T'HH:mm:ssxxx");

export const shiftDayKey = (dayKey: string, delta: number) => {
  const [year, month, day] = dayKey.split('-').map(Number);
  return format(new Date(year, month - 1, day + delta), DAY_KEY);
};

export const dayKeysBetween = (startKey: string, endKey: string) => {
  const keys: string[] = [];
  for (let key = startKey; key <= endKey; key = shiftDayKey(key, 1)) keys.push(key);
  return keys;
};

export const parseClock = (time: string) => {
  const [hours, minutes] = time.split(':');
  return Number(hours) * 60 + Number(minutes ?? 0);
};

const toRanges = (list: SlotRange[] | undefined): MinuteRange[] =>
  (list ?? []).map((slot) => ({ start: parseClock(slot.startTime), end: parseClock(slot.endTime) }));

export const isResourceKeyed = (slots: CalendarSlots) => Object.values(slots).some((value) => !!value && !Array.isArray(value));

/** Availability for a column: `null` when there is no availability data at all. */
export const slotRangesFor = (slots: CalendarSlots | null | undefined, dayKey: string, resourceId?: string): MinuteRange[] | null => {
  if (!slots) return null;
  if (!isResourceKeyed(slots)) return toRanges((slots as Record<string, SlotRange[]>)[dayKey]);
  const byResource = slots as Record<string, Record<string, SlotRange[]>>;
  const maps = resourceId === undefined ? Object.values(byResource) : [byResource[resourceId]];
  return maps.flatMap((map) => toRanges(map?.[dayKey]));
};

export const slotDates = (slots: CalendarSlots) =>
  new Set(
    isResourceKeyed(slots)
      ? Object.values(slots as Record<string, Record<string, SlotRange[]>>).flatMap((map) => Object.keys(map ?? {}))
      : Object.keys(slots),
  );

/** True when each step cell of [start, end) overlaps an available range (the same rule the cells are painted with). */
export const isWithin = (ranges: MinuteRange[], start: number, end: number, step: number) => {
  for (let minute = start; minute < end; minute += step) {
    if (!ranges.some((range) => minute < range.end && minute + step > range.start)) return false;
  }
  return true;
};

export const createRange = (anchor: number, current: number, step: number, min: number, max: number): MinuteRange => {
  const a = snapMinutes(anchor, step, 'floor');
  const c = snapMinutes(current, step, 'floor');
  return { start: clamp(Math.min(a, c), min, max - step), end: clamp(Math.max(a, c) + step, min + step, max) };
};

export const moveRange = (pointer: number, grab: number, duration: number, step: number, min: number, max: number): MinuteRange => {
  const start = clamp(snapMinutes(pointer - grab, step), min, Math.max(min, max - duration));
  return { start, end: start + duration };
};

export const resizeRange = (start: number, pointer: number, step: number, max: number): MinuteRange => ({
  start,
  end: clamp(snapMinutes(pointer, step), start + step, Math.max(start + step, max)),
});

/** Greedy lane packing: each span takes the lowest lane that is free across its columns. */
export const packLanes = <T extends { startCol: number; endCol: number }>(spans: T[]) => {
  const sorted = [...spans].sort((a, b) => a.startCol - b.startCol || b.endCol - b.startCol - (a.endCol - a.startCol));
  const laneEnds: number[] = [];
  const placed = sorted.map((span) => {
    let lane = laneEnds.findIndex((end) => end < span.startCol);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(span.endCol);
    } else laneEnds[lane] = span.endCol;
    return { ...span, lane };
  });
  return { placed, laneCount: laneEnds.length };
};
