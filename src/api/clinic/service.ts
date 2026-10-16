import { format } from 'date-fns';

import { invoiceBalance, normalizePhone } from './calc';
import { type ClinicOp, clinicStore } from './store';
import { dayKey } from './time';
import type { ClinicData, DailyMetric, Invoice, Patient, PatientSummary, PaymentMethod, Visit, VisitStatus } from './types';

export type ClinicErrorCode = 'conflict' | 'not-found' | 'invalid-transition' | 'duplicate-phone' | 'forced' | 'invalid';

export class ClinicError extends Error {
  readonly code: ClinicErrorCode;
  readonly fieldErrors?: Record<string, string>;

  constructor(code: ClinicErrorCode, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ClinicError';
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export type NewPatientInput = Omit<Patient, 'id' | 'mrn' | 'createdAt'>;
export type NewVisitInput = Omit<Visit, 'id' | 'status' | 'notes'> & { notes?: string | null };
export type VisitPatch = Pick<Visit, 'start' | 'end' | 'doctorId'>;
export type DayRange = { from: string; to: string };
export type BulkResult = { done: string[]; skipped: { id: string; reason: 'not-allowed' }[] };

const wait = () => {
  const [min, max] = clinicStore.latency();
  const ms = min + Math.random() * (max - min);
  return ms <= 0 ? Promise.resolve() : new Promise<void>((resolve) => setTimeout(resolve, ms));
};

/** Simulated request: latency, the failure hook, then the work (rules are checked at commit time) and a copy out. */
const request = async <T>(op: ClinicOp, work: (data: ClinicData) => T): Promise<T> => {
  await wait();
  if (clinicStore.takeFailure(op)) throw new ClinicError('forced', `Forced failure: ${op}`);
  return structuredClone(work(clinicStore.read()));
};

/** Like `request`, but the work mutates the tables and the result is persisted. */
const mutation = async <T>(op: ClinicOp, work: (data: ClinicData) => T): Promise<T> => {
  await wait();
  if (clinicStore.takeFailure(op)) throw new ClinicError('forced', `Forced failure: ${op}`);
  let result!: T;
  clinicStore.write((data) => {
    result = work(data);
  });
  return structuredClone(result);
};

const nowIso = () => format(clinicStore.now(), "yyyy-MM-dd'T'HH:mm:ssxxx");

const find = <T extends { id: string }>(items: T[], id: string, what: string) => {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new ClinicError('not-found', `${what} ${id} not found`);
  return item;
};

const summarize = (data: ClinicData, patient: Patient): PatientSummary => {
  const now = clinicStore.now().getTime();
  const visits = data.visits.filter((visit) => visit.patientId === patient.id);
  const last = visits
    .filter((v) => v.status === 'completed' && Date.parse(v.start) <= now)
    .sort((a, b) => Date.parse(b.start) - Date.parse(a.start))[0];
  const next = visits
    .filter((v) => v.status === 'scheduled' && Date.parse(v.start) > now)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))[0];
  const balance = data.invoices
    .filter((invoice) => invoice.patientId === patient.id && (invoice.status === 'sent' || invoice.status === 'overdue'))
    .reduce((sum, invoice) => sum + invoiceBalance(invoice), 0);
  return { ...patient, lastVisit: last?.start ?? null, nextVisit: next?.start ?? null, balance: Math.round(balance * 100) / 100 };
};

const assertFree = (data: ClinicData, doctorId: string, start: string, end: string, ignoreId?: string) => {
  const from = Date.parse(start);
  const to = Date.parse(end);
  if (!(to > from)) throw new ClinicError('invalid', 'A visit must end after it starts');
  const onLeave = data.leave.some((day) => day.doctorId === doctorId && day.date === start.slice(0, 10));
  const clash = data.visits.some(
    (visit) =>
      visit.id !== ignoreId &&
      visit.doctorId === doctorId &&
      visit.status !== 'cancelled' &&
      Date.parse(visit.start) < to &&
      Date.parse(visit.end) > from,
  );
  if (onLeave || clash) throw new ClinicError('conflict', 'The doctor is not free at that time');
};

const inRange = (key: string, range: DayRange) => key >= range.from && key <= range.to;

const payable = (invoice: Invoice) => invoice.status === 'sent' || invoice.status === 'overdue';

/**
 * Next id for records created in this session, derived from the stored data so it survives a page reload
 * (a module-level counter would restart at 1 and reuse ids).
 */
const nextId = (prefix: string, ids: string[]) => {
  const pattern = new RegExp(`^${prefix}-new-(\\d+)$`);
  const max = ids.reduce((highest, id) => Math.max(highest, Number(pattern.exec(id)?.[1] ?? 0)), 0);
  return `${prefix}-new-${max + 1}`;
};

const paymentIds = (data: ClinicData) => data.invoices.flatMap((invoice) => invoice.payments.map((payment) => payment.id));

export const clinicService = {
  listDoctors: () => request('listDoctors', (data) => data.doctors),
  listInsurers: () => request('listInsurers', (data) => data.insurers),

  listPatients: () =>
    request('listPatients', (data) =>
      data.patients.map((patient) => summarize(data, patient)).sort((a, b) => a.name.en.localeCompare(b.name.en)),
    ),

  getPatient: (id: string) => request('getPatient', (data) => summarize(data, find(data.patients, id, 'Patient'))),

  registerPatient: (input: NewPatientInput) =>
    mutation('registerPatient', (data) => {
      if (data.patients.some((patient) => normalizePhone(patient.phone) === normalizePhone(input.phone))) {
        throw new ClinicError('duplicate-phone', 'A patient with this phone already exists', { phone: 'duplicate-phone' });
      }
      const nextMrn = Math.max(...data.patients.map((patient) => Number(patient.mrn.replace('MRN-', '')))) + 1;
      const patient: Patient = {
        ...input,
        id: nextId(
          'pt',
          data.patients.map((p) => p.id),
        ),
        mrn: `MRN-${nextMrn}`,
        createdAt: nowIso(),
      };
      data.patients.push(patient);
      return patient;
    }),

  listVisits: (range: DayRange) => request('listVisits', (data) => data.visits.filter((visit) => inRange(visit.start.slice(0, 10), range))),
  listLeave: (range: DayRange) => request('listLeave', (data) => data.leave.filter((day) => inRange(day.date, range))),

  createVisit: (input: NewVisitInput) =>
    mutation('createVisit', (data) => {
      find(data.patients, input.patientId, 'Patient');
      assertFree(data, input.doctorId, input.start, input.end);
      const visit: Visit = {
        ...input,
        notes: input.notes ?? null,
        id: nextId(
          'vs',
          data.visits.map((v) => v.id),
        ),
        status: 'scheduled',
      };
      data.visits.push(visit);
      return visit;
    }),

  updateVisit: (id: string, patch: VisitPatch) =>
    mutation('updateVisit', (data) => {
      const visit = find(data.visits, id, 'Visit');
      assertFree(data, patch.doctorId, patch.start, patch.end, id);
      Object.assign(visit, patch);
      return visit;
    }),

  setVisitStatus: (id: string, status: VisitStatus) =>
    mutation('setVisitStatus', (data) => {
      const visit = find(data.visits, id, 'Visit');
      visit.status = status;
      return visit;
    }),

  listInvoices: () => request('listInvoices', (data) => [...data.invoices].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))),
  getInvoice: (id: string) => request('getInvoice', (data) => find(data.invoices, id, 'Invoice')),

  recordPayment: (id: string, payment: { amount: number; method: PaymentMethod; date: string }) =>
    mutation('recordPayment', (data) => {
      const invoice = find(data.invoices, id, 'Invoice');
      if (!payable(invoice)) throw new ClinicError('invalid-transition', `Cannot record a payment on a ${invoice.status} invoice`);
      if (!(payment.amount > 0) || payment.amount > invoiceBalance(invoice))
        throw new ClinicError('invalid', 'The amount must be above 0 and at most the balance');
      invoice.payments.push({ id: nextId('pay', paymentIds(data)), ...payment });
      if (invoiceBalance(invoice) === 0) invoice.status = 'paid';
      return invoice;
    }),

  sendInvoice: (id: string) =>
    mutation('sendInvoice', (data) => {
      const invoice = find(data.invoices, id, 'Invoice');
      if (invoice.status !== 'draft') throw new ClinicError('invalid-transition', `Cannot send a ${invoice.status} invoice`);
      invoice.status = invoice.dueAt < dayKey(clinicStore.now()) ? 'overdue' : 'sent';
      return invoice;
    }),

  voidInvoice: (id: string) =>
    mutation('voidInvoice', (data) => {
      const invoice = find(data.invoices, id, 'Invoice');
      if (invoice.status === 'paid') throw new ClinicError('invalid-transition', 'A paid invoice cannot be voided');
      invoice.status = 'void';
      return invoice;
    }),

  bulkInvoices: (ids: string[], action: 'mark-paid' | 'send-reminder') =>
    mutation('bulkInvoices', (data): BulkResult => {
      const result: BulkResult = { done: [], skipped: [] };
      for (const id of ids) {
        const invoice = data.invoices.find((candidate) => candidate.id === id);
        if (!invoice || !payable(invoice)) {
          result.skipped.push({ id, reason: 'not-allowed' });
          continue;
        }
        if (action === 'mark-paid') {
          invoice.payments.push({
            id: nextId('pay', paymentIds(data)),
            amount: invoiceBalance(invoice),
            method: 'card',
            date: dayKey(clinicStore.now()),
          });
          invoice.status = 'paid';
        }
        result.done.push(id);
      }
      return result;
    }),

  listMetrics: (days: 7 | 30 | 90) => request('listMetrics', (data): DailyMetric[] => data.metrics.slice(-days)),
};
