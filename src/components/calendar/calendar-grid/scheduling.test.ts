import { describe, expect, it } from 'vite-plus/test';

import {
  clamp,
  columnAt,
  createRange,
  dayKeyOf,
  dayKeysBetween,
  isResourceKeyed,
  isWithin,
  lastDayKeyOf,
  minuteOfDay,
  moveRange,
  offsetToMinutes,
  packLanes,
  parseClock,
  resizeRange,
  shiftDayKey,
  slotDates,
  slotRangesFor,
  snapMinutes,
  spansDays,
  wallTime,
} from './scheduling';

describe('snapping and clamping', () => {
  it('snaps to the step, rounding or flooring', () => {
    expect(snapMinutes(607, 15)).toBe(600);
    expect(snapMinutes(608, 15)).toBe(615);
    expect(snapMinutes(614, 15, 'floor')).toBe(600);
    expect(clamp(5, 10, 20)).toBe(10);
  });

  it('maps a pointer offset to a minute and clamps outside the column', () => {
    expect(offsetToMinutes(100, 800, 8, 16)).toBe(540);
    expect(offsetToMinutes(-40, 800, 8, 16)).toBe(480);
    expect(offsetToMinutes(900, 800, 8, 16)).toBe(960);
    expect(offsetToMinutes(10, 0, 8, 16)).toBe(960);
  });

  it('finds the column under the pointer, -1 outside', () => {
    const rects = [
      { left: 100, right: 300 },
      { left: 300, right: 500 },
    ];
    expect(columnAt(150, rects)).toBe(0);
    expect(columnAt(300, rects)).toBe(1);
    expect(columnAt(50, rects)).toBe(-1);
  });
});

describe('wall time and day keys', () => {
  it('reads the local minute and day of a timestamp', () => {
    expect(minuteOfDay('2026-10-16T10:30:00')).toBe(630);
    expect(dayKeyOf('2026-10-16T23:59:00')).toBe('2026-10-16');
    expect(dayKeyOf('2026-10-16')).toBe('2026-10-16');
  });

  it('builds wall time from parts, so the clock reads the same across a DST change', () => {
    // 2026-03-29 is the EU spring-forward day; 10:00 must stay 10:00 whatever the zone.
    expect(wallTime('2026-03-29', 600).slice(0, 19)).toBe('2026-03-29T10:00:00');
    expect(minuteOfDay(wallTime('2026-03-29', 600))).toBe(600);
    expect(wallTime('2026-10-16', 24 * 60).slice(0, 10)).toBe('2026-10-17');
  });

  it('shifts and lists day keys', () => {
    expect(shiftDayKey('2026-10-31', 1)).toBe('2026-11-01');
    expect(dayKeysBetween('2026-10-30', '2026-11-01')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01']);
  });

  it('treats an end exactly at midnight as the day before', () => {
    expect(spansDays('2026-10-16T23:00:00', '2026-10-17T00:00:00')).toBe(false);
    expect(spansDays('2026-10-16T23:00:00', '2026-10-17T01:00:00')).toBe(true);
    expect(lastDayKeyOf('2026-10-16T00:00:00', '2026-10-19T00:00:00')).toBe('2026-10-18');
    expect(lastDayKeyOf('2026-10-16T10:00:00', '2026-10-16T10:00:00')).toBe('2026-10-16');
  });
});

describe('availability', () => {
  const byDate = { '2026-10-16': [{ startTime: '09:00', endTime: '12:00' }] };
  const byResource = {
    haddad: { '2026-10-16': [{ startTime: '09:00', endTime: '10:00' }] },
    khalil: { '2026-10-16': [{ startTime: '13:00', endTime: '14:00' }] },
  };

  it('reads date-keyed and resource-keyed slots', () => {
    expect(parseClock('09:30')).toBe(570);
    expect(isResourceKeyed(byDate)).toBe(false);
    expect(isResourceKeyed(byResource)).toBe(true);
    expect(slotRangesFor(undefined, '2026-10-16')).toBeNull();
    expect(slotRangesFor(byDate, '2026-10-17')).toEqual([]);
    expect(slotRangesFor(byResource, '2026-10-16', 'haddad')).toEqual([{ start: 540, end: 600 }]);
    expect(slotRangesFor(byResource, '2026-10-16')).toEqual([
      { start: 540, end: 600 },
      { start: 780, end: 840 },
    ]);
    expect([...slotDates(byResource)]).toEqual(['2026-10-16']);
  });

  it('accepts a range only when every step cell overlaps availability', () => {
    const ranges = [{ start: 540, end: 720 }];
    expect(isWithin(ranges, 540, 600, 30)).toBe(true);
    expect(isWithin(ranges, 690, 750, 30)).toBe(false);
  });
});

describe('gesture ranges', () => {
  it('creates a range covering both ends, at least one step', () => {
    expect(createRange(610, 610, 30, 480, 960)).toEqual({ start: 600, end: 630 });
    expect(createRange(700, 610, 30, 480, 960)).toEqual({ start: 600, end: 720 });
    expect(createRange(950, 990, 30, 480, 960)).toEqual({ start: 930, end: 960 });
  });

  it('moves keeping the duration and stays inside the hours', () => {
    expect(moveRange(640, 10, 60, 15, 480, 960)).toEqual({ start: 630, end: 690 });
    expect(moveRange(990, 0, 60, 15, 480, 960)).toEqual({ start: 900, end: 960 });
    expect(moveRange(400, 0, 600, 15, 480, 960)).toEqual({ start: 480, end: 1080 });
  });

  it('resizes the end, never below one step', () => {
    expect(resizeRange(600, 680, 15, 960)).toEqual({ start: 600, end: 675 });
    expect(resizeRange(600, 590, 15, 960)).toEqual({ start: 600, end: 615 });
  });
});

describe('lane packing', () => {
  it('puts overlapping spans in separate lanes and reuses freed lanes', () => {
    const { placed, laneCount } = packLanes([
      { id: 'a', startCol: 0, endCol: 2 },
      { id: 'b', startCol: 1, endCol: 1 },
      { id: 'c', startCol: 3, endCol: 4 },
    ]);
    expect(laneCount).toBe(2);
    expect(placed.find((p) => p.id === 'a')?.lane).toBe(0);
    expect(placed.find((p) => p.id === 'b')?.lane).toBe(1);
    expect(placed.find((p) => p.id === 'c')?.lane).toBe(0);
  });
});
