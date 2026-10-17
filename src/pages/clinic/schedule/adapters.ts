import type { CalendarAccessors, CalendarRange, CalendarResource } from '@components/calendar';

import { type Doctor, isFriday, type LeaveDay, type Localized, shiftDay, type Visit, wallTime } from '@api/clinic';

/** What the schedule grid shows: a visit, or a doctor's day off (an all-day event). */
export type ScheduleEvent =
  | { kind: 'visit'; id: string; start: string; end: string; doctorId: string; visit: Visit }
  | { kind: 'leave'; id: string; start: string; end: string; doctorId: string; leave: LeaveDay };

type TimeRange = { startTime: string; endTime: string };

const MORNING: TimeRange = { startTime: '08:00', endTime: '12:00' };
const AFTERNOON: TimeRange = { startTime: '13:00', endTime: '17:00' };

/** Cancelled visits are left out; a leave day runs from its midnight to the next. */
export const toScheduleEvents = (visits: Visit[], leave: LeaveDay[]): ScheduleEvent[] => [
  ...visits
    .filter((visit) => visit.status !== 'cancelled')
    .map((visit): ScheduleEvent => ({ kind: 'visit', id: visit.id, start: visit.start, end: visit.end, doctorId: visit.doctorId, visit })),
  ...leave.map((day): ScheduleEvent => ({
    kind: 'leave',
    id: `leave-${day.id}`,
    start: wallTime(day.date, 0),
    end: wallTime(shiftDay(day.date, 1), 0),
    doctorId: day.doctorId,
    leave: day,
  })),
];

export const scheduleAccessors: CalendarAccessors<ScheduleEvent> = {
  getId: (event) => event.id,
  getStartTime: (event) => event.start,
  getEndTime: (event) => event.end,
  getResourceId: (event) => event.doctorId,
  isAllDay: (event) => event.kind === 'leave',
};

export const toResources = (doctors: Doctor[], localize: (value: Localized) => string): CalendarResource[] =>
  doctors.map((doctor) => ({ id: doctor.id, label: localize(doctor.name) }));

/** Opening hours per doctor and day: mornings and afternoons, Friday mornings only, nothing on a leave day. */
export const toSlots = (doctors: Pick<Doctor, 'id'>[], leave: LeaveDay[], range: CalendarRange) => {
  const days: string[] = [];
  for (let day = range.startDate; day <= range.endDate; day = shiftDay(day, 1)) days.push(day);
  return Object.fromEntries(
    doctors.map((doctor) => [
      doctor.id,
      Object.fromEntries(
        days.map((day) => [
          day,
          leave.some((off) => off.doctorId === doctor.id && off.date === day) ? [] : isFriday(day) ? [MORNING] : [MORNING, AFTERNOON],
        ]),
      ),
    ]),
  ) as Record<string, Record<string, TimeRange[]>>;
};
