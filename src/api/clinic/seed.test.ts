import { describe, expect, it } from 'vite-plus/test';

import { invoiceBalance } from './calc';
import { createClinicSeed } from './seed';
import { dayKey, isFriday, shiftDay } from './time';

const NOW = new Date(2026, 9, 16, 9, 0);
const today = dayKey(NOW);

describe('clinic seed', () => {
  it('is deterministic for a date', () => {
    expect(JSON.stringify(createClinicSeed(NOW))).toBe(JSON.stringify(createClinicSeed(NOW)));
  });

  it('has the expected shape', () => {
    const data = createClinicSeed(NOW);
    expect(data.version).toBe(1);
    expect(data.seededOn).toBe(today);
    expect(data.doctors).toHaveLength(4);
    expect(data.insurers).toHaveLength(3);
    expect(data.patients).toHaveLength(60);
    expect(data.visits.length).toBeGreaterThanOrEqual(100);
    expect(data.visits.length).toBeLessThanOrEqual(300);
    expect(data.invoices.length).toBeGreaterThan(40);
    expect(data.metrics).toHaveLength(90);
    expect(data.leave.length).toBeGreaterThanOrEqual(2);
  });

  it('gives every patient a unique MRN and phone and both name languages', () => {
    const { patients } = createClinicSeed(NOW);
    expect(new Set(patients.map((p) => p.mrn)).size).toBe(60);
    expect(new Set(patients.map((p) => p.phone)).size).toBe(60);
    expect(patients.every((p) => p.name.en && p.name.ar && /^\+962 7\d \d{3} \d{4}$/.test(p.phone))).toBe(true);
  });

  it('never double-books a doctor, books Fridays in the morning only, and nothing on leave days', () => {
    const { visits, leave } = createClinicSeed(NOW);
    const byDoctor = new Map<string, typeof visits>();
    for (const visit of visits) byDoctor.set(visit.doctorId, [...(byDoctor.get(visit.doctorId) ?? []), visit]);
    for (const list of byDoctor.values()) {
      const sorted = [...list].sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
      for (let i = 1; i < sorted.length; i += 1) expect(Date.parse(sorted[i].start)).toBeGreaterThanOrEqual(Date.parse(sorted[i - 1].end));
    }
    const fridays = visits.filter((v) => isFriday(v.start.slice(0, 10)));
    expect(fridays.length).toBeGreaterThan(0);
    expect(fridays.every((v) => new Date(v.end).getHours() * 60 + new Date(v.end).getMinutes() <= 12 * 60)).toBe(true);
    for (const day of leave) expect(visits.some((v) => v.doctorId === day.doctorId && v.start.startsWith(day.date))).toBe(false);
  });

  it('keeps visits within three weeks of today with statuses that fit their time', () => {
    const { visits } = createClinicSeed(NOW);
    const first = shiftDay(today, -21);
    const last = shiftDay(today, 21);
    expect(visits.every((v) => v.start.slice(0, 10) >= first && v.start.slice(0, 10) <= last)).toBe(true);
    expect(visits.filter((v) => Date.parse(v.start) > NOW.getTime()).every((v) => v.status === 'scheduled')).toBe(true);
    expect(visits.filter((v) => Date.parse(v.end) <= NOW.getTime()).every((v) => v.status !== 'scheduled')).toBe(true);
    expect(visits.filter((v) => v.start.startsWith(today)).length).toBeGreaterThanOrEqual(6);
  });

  it('keeps invoices consistent with their payments', () => {
    const { invoices } = createClinicSeed(NOW);
    for (const invoice of invoices) {
      if (invoice.status === 'paid') expect(invoiceBalance(invoice)).toBe(0);
      if (invoice.status === 'sent' || invoice.status === 'overdue') expect(invoiceBalance(invoice)).toBeGreaterThan(0);
      if (invoice.status === 'overdue') expect(invoice.dueAt < today).toBe(true);
    }
    expect(new Set(invoices.map((i) => i.number)).size).toBe(invoices.length);
  });
});
