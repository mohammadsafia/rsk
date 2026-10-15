/** Pure helpers behind the TimePicker columns. Times are minutes since midnight. */

export type TimePeriod = 'AM' | 'PM';

export type TimeOption = { label: string; value: number };

export type TimeColumns = { hours: TimeOption[]; minutes: TimeOption[]; periods: TimePeriod[] };

const MINUTES_PER_DAY = 24 * 60;
const NOON = 12 * 60;

const pad = (value: number) => value.toString().padStart(2, '0');

const hourOf = (time: number) => Math.floor(time / 60);

/** Parses "HH:MM" (24h) or "hh:MM AM|PM" (12h). Returns null for anything else. */
export function parseTime(value: string | null | undefined): number | null {
  if (!value) return null;

  const match = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i.exec(value.trim());
  if (!match) return null;

  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();
  let hours = Number(match[1]);

  if (minutes > 59) return null;

  if (period) {
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (period === 'PM' ? 12 : 0);
  } else if (hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
}

export function formatTime(time: number, use24h: boolean): string {
  const hours = hourOf(time);
  const minutes = time % 60;

  if (use24h) return `${pad(hours)}:${pad(minutes)}`;

  return `${pad(hours % 12 === 0 ? 12 : hours % 12)}:${pad(minutes)} ${hours >= 12 ? 'PM' : 'AM'}`;
}

/** Every selectable time from min to max inclusive, on a step grid anchored at min. */
export function availableTimes(min: string, max: string, step: number): number[] {
  const start = parseTime(min) ?? 0;
  const end = parseTime(max) ?? MINUTES_PER_DAY - 1;
  const increment = Math.max(1, Math.floor(step));

  const times: number[] = [];
  for (let time = start; time <= end; time += increment) times.push(time);

  return times;
}

/** The available time closest to target (earlier wins ties); the first slot when target is null. */
export function nearestTime(available: number[], target: number | null): number | null {
  if (available.length === 0) return null;
  if (target === null) return available[0];

  return available.reduce((best, time) => (Math.abs(time - target) < Math.abs(best - target) ? time : best), available[0]);
}

export function buildTimeColumns(available: number[], selected: number, use24h: boolean): TimeColumns {
  const selectedHour = hourOf(selected);
  const isPm = selectedHour >= 12;
  const allHours = [...new Set(available.map(hourOf))];

  // In 12h mode the hour column shows only the selected period; ascending 0…11 renders as 12, 01 … 11.
  const visibleHours = use24h ? allHours : allHours.filter((hour) => hour >= 12 === isPm);

  const hours = visibleHours.map((hour) => ({
    value: hour,
    label: use24h ? pad(hour) : pad(hour % 12 === 0 ? 12 : hour % 12),
  }));

  const minutes = available.filter((time) => hourOf(time) === selectedHour).map((time) => ({ value: time % 60, label: pad(time % 60) }));

  const periods: TimePeriod[] = use24h
    ? []
    : (['AM', 'PM'] as const).filter((period) => allHours.some((hour) => hour >= 12 === (period === 'PM')));

  return { hours, minutes, periods };
}

/** Moves to `hour`, keeping the minute when that hour offers it. */
export function selectHour(available: number[], selected: number, hour: number): number {
  const sameMinute = hour * 60 + (selected % 60);
  if (available.includes(sameMinute)) return sameMinute;

  return available.find((time) => hourOf(time) === hour) ?? selected;
}

export function selectMinute(available: number[], selected: number, minute: number): number {
  const candidate = hourOf(selected) * 60 + minute;

  return available.includes(candidate) ? candidate : selected;
}

/** Shifts by twelve hours into `period`, or to the nearest slot inside it. */
export function selectPeriod(available: number[], selected: number, period: TimePeriod): number {
  const wantsPm = period === 'PM';
  if (selected >= NOON === wantsPm) return selected;

  const shifted = selected + (wantsPm ? NOON : -NOON);
  if (available.includes(shifted)) return shifted;

  return (
    nearestTime(
      available.filter((time) => time >= NOON === wantsPm),
      shifted,
    ) ?? selected
  );
}
