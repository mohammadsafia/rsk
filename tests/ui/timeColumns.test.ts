import { describe, expect, it } from 'vite-plus/test';

import {
  availableTimes,
  buildTimeColumns,
  formatTime,
  nearestTime,
  parseTime,
  selectHour,
  selectMinute,
  selectPeriod,
} from '../../src/components/ui/time-picker/timeColumns';

describe('parseTime / formatTime', () => {
  it.each([
    ['10:30', 630],
    ['00:05', 5],
    ['12:30 AM', 30],
    ['12:30 PM', 750],
    ['01:00 pm', 780],
  ])('parses %s as %i minutes', (input, minutes) => {
    expect(parseTime(input)).toBe(minutes);
  });

  it.each(['', '24:00', '13:00 PM', '9', 'noon'])('rejects %j', (input) => {
    expect(parseTime(input)).toBeNull();
  });

  it('formats 24h and 12h values', () => {
    expect(formatTime(630, true)).toBe('10:30');
    expect(formatTime(0, false)).toBe('12:00 AM');
    expect(formatTime(750, false)).toBe('12:30 PM');
  });
});

describe('availableTimes', () => {
  it('includes max', () => {
    expect(availableTimes('09:00', '10:00', 30)).toEqual([540, 570, 600]);
  });

  it('anchors the step grid at min', () => {
    expect(availableTimes('09:10', '10:00', 25)).toEqual([550, 575, 600]);
  });
});

describe('buildTimeColumns', () => {
  const allDay = availableTimes('00:00', '23:59', 30);

  it('lists 00–23 in 24h mode', () => {
    const { hours, periods } = buildTimeColumns(allDay, 630, true);
    expect(hours.map((hour) => hour.label)).toEqual(Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0')));
    expect(periods).toEqual([]);
  });

  it('lists 12, 01 … 11 for the selected period in 12h mode', () => {
    const { hours, periods } = buildTimeColumns(allDay, 630, false);
    expect(hours.map((hour) => hour.label)).toEqual(['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11']);
    expect(hours[0].value).toBe(0);
    expect(periods).toEqual(['AM', 'PM']);
  });

  it('offers only the periods inside the range', () => {
    expect(buildTimeColumns(availableTimes('13:00', '18:00', 60), 780, false).periods).toEqual(['PM']);
  });

  it("lists the selected hour's minutes", () => {
    expect(buildTimeColumns(allDay, 630, true).minutes.map((minute) => minute.label)).toEqual(['00', '30']);
  });
});

describe('selection', () => {
  const quarterHours = availableTimes('09:15', '17:00', 15);

  it('keeps the minute when the new hour has it', () => {
    expect(selectHour(quarterHours, 9 * 60 + 30, 11)).toBe(11 * 60 + 30);
  });

  it("falls back to the hour's first minute otherwise", () => {
    expect(selectHour(quarterHours, 10 * 60, 9)).toBe(9 * 60 + 15);
  });

  it('ignores a minute the hour does not offer', () => {
    expect(selectMinute(quarterHours, 9 * 60 + 15, 0)).toBe(9 * 60 + 15);
  });

  it('moves between periods by twelve hours when possible', () => {
    const allDay = availableTimes('00:00', '23:59', 30);
    expect(selectPeriod(allDay, 9 * 60 + 30, 'PM')).toBe(21 * 60 + 30);
    expect(selectPeriod(allDay, 21 * 60 + 30, 'AM')).toBe(9 * 60 + 30);
  });

  it('nearestTime snaps an off-grid value to the closest slot', () => {
    expect(nearestTime(quarterHours, 9 * 60 + 20)).toBe(9 * 60 + 15);
    expect(nearestTime(quarterHours, null)).toBe(9 * 60 + 15);
    expect(nearestTime([], 10)).toBeNull();
  });
});
