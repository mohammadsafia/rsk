// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { invoiceBalance } from './calc';
import { ClinicError, clinicService } from './service';
import { clinicStore } from './store';
import { dayKey, shiftDay, wallTime } from './time';

const NOW = new Date(2026, 9, 16, 9, 0);
const today = dayKey(NOW);

beforeEach(() => {
  sessionStorage.clear();
  clinicStore.setClock(() => NOW);
  clinicStore.setLatency([0, 0]);
  clinicStore.reset();
});

afterEach(() => clinicStore.setClock(null));

const freeSlot = () => {
  // Tomorrow-or-later 18:00 is outside every seeded window, so it is free for any doctor.
  let key = shiftDay(today, 1);
  if (new Date(`${key}T12:00:00`).getDay() === 5) key = shiftDay(key, 1);
  return { start: wallTime(key, 18 * 60), end: wallTime(key, 18 * 60 + 30) };
};

describe('clinicService patients', () => {
  it('lists summaries sorted by name with joined figures', async () => {
    const patients = await clinicService.listPatients();
    expect(patients).toHaveLength(60);
    const names = patients.map((p) => p.name.en);
    expect(names).toEqual(names.toSorted((a, b) => a.localeCompare(b)));
    expect(patients.some((p) => p.lastVisit !== null)).toBe(true);
    expect(patients.some((p) => p.nextVisit !== null)).toBe(true);
    expect(patients.some((p) => p.balance > 0)).toBe(true);
  });

  it('returns copies: changing a result never changes the store', async () => {
    const [first] = await clinicService.listPatients();
    first.name.en = 'Changed';
    const again = await clinicService.getPatient(first.id);
    expect(again.name.en).not.toBe('Changed');
  });

  it('rejects an unknown patient and a duplicate phone', async () => {
    await expect(clinicService.getPatient('nope')).rejects.toMatchObject({ code: 'not-found' });
    const existing = clinicStore.read().patients[0];
    const input = { ...existing, phone: existing.phone.replace(/\s/g, '') };
    const error = await clinicService.registerPatient(input).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ClinicError);
    expect(error).toMatchObject({ code: 'duplicate-phone', fieldErrors: { phone: 'duplicate-phone' } });
  });

  it('registers a patient with the next MRN', async () => {
    const existing = clinicStore.read().patients[0];
    const created = await clinicService.registerPatient({ ...existing, phone: '+962 79 000 0001' });
    expect(created.mrn).toBe('MRN-10061');
    expect((await clinicService.listPatients()).some((p) => p.id === created.id)).toBe(true);
  });
});

describe('clinicService visits', () => {
  it('lists visits and leave in a day range', async () => {
    const visits = await clinicService.listVisits({ from: today, to: today });
    expect(visits.length).toBeGreaterThan(0);
    expect(visits.every((v) => v.start.startsWith(today))).toBe(true);
    const leave = await clinicService.listLeave({ from: shiftDay(today, -7), to: shiftDay(today, 7) });
    expect(leave.length).toBe(2);
  });

  it('refuses to double-book a doctor, also when two bookings race', async () => {
    const slot = freeSlot();
    const input = { patientId: 'pt-001', doctorId: 'dr-haddad', type: 'consultation' as const, ...slot };
    clinicStore.setLatency([5, 5]);
    const results = await Promise.allSettled([clinicService.createVisit(input), clinicService.createVisit(input)]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((r) => r.status === 'rejected')).toMatchObject({ reason: { code: 'conflict' } });
  });

  it('refuses a booking on a leave day and lets a move keep its own slot', async () => {
    const leave = clinicStore.read().leave.find((day) => day.doctorId === 'dr-khalil')!;
    await expect(
      clinicService.createVisit({
        patientId: 'pt-001',
        doctorId: 'dr-khalil',
        type: 'consultation',
        start: wallTime(leave.date, 600),
        end: wallTime(leave.date, 630),
      }),
    ).rejects.toMatchObject({ code: 'conflict' });

    const visit = clinicStore.read().visits.find((v) => v.status === 'scheduled')!;
    const shifted = await clinicService.updateVisit(visit.id, { start: visit.start, end: visit.end, doctorId: visit.doctorId });
    expect(shifted.start).toBe(visit.start);
  });
});

describe('clinicService invoices', () => {
  it('records a payment and marks the invoice paid at zero balance', async () => {
    const invoice = clinicStore.read().invoices.find((i) => i.status === 'sent' || i.status === 'overdue')!;
    const balance = invoiceBalance(invoice);
    const paid = await clinicService.recordPayment(invoice.id, { amount: balance, method: 'cash', date: today });
    expect(paid.status).toBe('paid');
    await expect(clinicService.recordPayment(invoice.id, { amount: 1, method: 'cash', date: today })).rejects.toMatchObject({
      code: 'invalid-transition',
    });
  });

  it('refuses overpayments, voiding a paid invoice and sending a sent one', async () => {
    const sent = clinicStore.read().invoices.find((i) => i.status === 'sent')!;
    await expect(
      clinicService.recordPayment(sent.id, { amount: invoiceBalance(sent) + 1, method: 'cash', date: today }),
    ).rejects.toMatchObject({ code: 'invalid' });
    await expect(clinicService.sendInvoice(sent.id)).rejects.toMatchObject({ code: 'invalid-transition' });
    const paid = clinicStore.read().invoices.find((i) => i.status === 'paid')!;
    await expect(clinicService.voidInvoice(paid.id)).rejects.toMatchObject({ code: 'invalid-transition' });
  });

  it('bulk-marks paid what it can and reports the rest', async () => {
    const { invoices } = clinicStore.read();
    const open = invoices.find((i) => i.status === 'overdue' || i.status === 'sent')!;
    const voided = invoices.find((i) => i.status === 'void') ?? invoices.find((i) => i.status === 'paid')!;
    const result = await clinicService.bulkInvoices([open.id, voided.id], 'mark-paid');
    expect(result).toEqual({ done: [open.id], skipped: [{ id: voided.id, reason: 'not-allowed' }] });
    expect((await clinicService.getInvoice(open.id)).status).toBe('paid');
  });
});

describe('clinicService failures and metrics', () => {
  it('fails an operation once through the failure hook', async () => {
    clinicStore.failNext('listPatients');
    await expect(clinicService.listPatients()).rejects.toMatchObject({ code: 'forced' });
    await expect(clinicService.listPatients()).resolves.toHaveLength(60);
  });

  it('returns the last N days of metrics', async () => {
    expect(await clinicService.listMetrics(7)).toHaveLength(7);
    expect(await clinicService.listMetrics(90)).toHaveLength(90);
  });
});

describe('clinicService ids across page loads', () => {
  /** A page load: fresh service and store modules over the same sessionStorage. */
  const pageLoad = async () => {
    const { vi } = await import('vite-plus/test');
    vi.resetModules();
    const { clinicService: service } = await import('./service');
    const { clinicStore: store } = await import('./store');
    store.setClock(() => NOW);
    store.setLatency([0, 0]);
    return { service, store };
  };

  it('never reuses an id after a reload', async () => {
    const template = clinicStore.read().patients[0];
    const firstLoad = await pageLoad();
    const first = await firstLoad.service.registerPatient({ ...template, phone: '+962 79 000 0001' });
    const secondLoad = await pageLoad();
    const second = await secondLoad.service.registerPatient({ ...template, phone: '+962 79 000 0002' });

    expect(second.id).not.toBe(first.id);
    expect((await secondLoad.service.getPatient(first.id)).phone).toBe('+962 79 000 0001');
    expect((await secondLoad.service.getPatient(second.id)).phone).toBe('+962 79 000 0002');
  });
});
