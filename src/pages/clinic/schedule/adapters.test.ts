import { describe, expect, it } from 'vite-plus/test';

import type { LeaveDay, Visit } from '@api/clinic';

import { scheduleAccessors, toScheduleEvents, toSlots } from './adapters';

const visit = (overrides: Partial<Visit>): Visit => ({
  id: 'v1',
  patientId: 'p1',
  doctorId: 'dr-a',
  start: '2026-10-16T09:00:00+03:00',
  end: '2026-10-16T09:30:00+03:00',
  type: 'consultation',
  status: 'scheduled',
  notes: null,
  ...overrides,
});
const leave: LeaveDay = { id: 'l1', doctorId: 'dr-b', date: '2026-10-18', reason: 'leave' };

describe('schedule adapters', () => {
  it('drops cancelled visits and turns leave into an all-day event for that doctor', () => {
    const events = toScheduleEvents([visit({}), visit({ id: 'v2', status: 'cancelled' })], [leave]);
    expect(events.map((e) => e.id)).toEqual(['v1', 'leave-l1']);
    const off = events[1];
    expect(scheduleAccessors.isAllDay?.(off)).toBe(true);
    expect(scheduleAccessors.getResourceId?.(off)).toBe('dr-b');
    expect(off.start.slice(0, 10)).toBe('2026-10-18');
    expect(off.end.slice(0, 10)).toBe('2026-10-19');
  });

  it('opens working hours per doctor, half days on Friday, nothing on leave', () => {
    const slots = toSlots([{ id: 'dr-a' }, { id: 'dr-b' }], [leave], { startDate: '2026-10-16', endDate: '2026-10-18' });
    expect(slots['dr-a']['2026-10-16']).toEqual([{ startTime: '08:00', endTime: '12:00' }]);
    expect(slots['dr-a']['2026-10-17']).toEqual([
      { startTime: '08:00', endTime: '12:00' },
      { startTime: '13:00', endTime: '17:00' },
    ]);
    expect(slots['dr-b']['2026-10-18']).toEqual([]);
  });
});
