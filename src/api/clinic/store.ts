import { createClinicSeed } from './seed';
import { dayKey } from './time';
import type { ClinicData } from './types';

export const STORAGE_KEY = 'rsk:clinic:v1';

export type ClinicOp =
  | 'listDoctors'
  | 'listInsurers'
  | 'listPatients'
  | 'getPatient'
  | 'registerPatient'
  | 'listVisits'
  | 'listLeave'
  | 'createVisit'
  | 'updateVisit'
  | 'setVisitStatus'
  | 'listInvoices'
  | 'getInvoice'
  | 'recordPayment'
  | 'sendInvoice'
  | 'voidInvoice'
  | 'bulkInvoices'
  | 'listMetrics';

let clock: (() => Date) | null = null;
let latency: [number, number] = [250, 600];
let data: ClinicData | null = null;
const failures = new Set<ClinicOp>();

const now = () => (clock ? clock() : new Date());

const isClinicData = (value: unknown): value is ClinicData => {
  const candidate = value as Partial<ClinicData> | null;
  return (
    !!candidate &&
    candidate.version === 1 &&
    typeof candidate.seededOn === 'string' &&
    ['doctors', 'insurers', 'patients', 'visits', 'leave', 'invoices', 'metrics'].every((table) =>
      Array.isArray((candidate as Record<string, unknown>)[table]),
    )
  );
};

const save = (next: ClinicData) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable or full: the data still lives in memory for this page.
  }
};

/** Stored data from today, or a fresh seed (corrupt, outdated or yesterday's data is replaced). */
const load = (): ClinicData => {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null') as unknown;
    if (isClinicData(parsed) && parsed.seededOn === dayKey(now())) return parsed;
  } catch {
    // Unparseable: reseed below.
  }
  const fresh = createClinicSeed(now());
  save(fresh);
  return fresh;
};

/** In-memory clinic tables, persisted to sessionStorage. Only `service.ts` should use this directly. */
export const clinicStore = {
  read: (): ClinicData => (data ??= load()),
  write: (mutate: (draft: ClinicData) => void) => {
    const current = clinicStore.read();
    mutate(current);
    save(current);
  },
  /** Re-reads sessionStorage, as a page reload would. */
  reload: () => {
    data = load();
  },
  /** Discards everything and reseeds for `now`. */
  reset: () => {
    data = createClinicSeed(now());
    save(data);
  },
  now,
  setClock: (next: (() => Date) | null) => {
    clock = next;
  },
  latency: () => latency,
  setLatency: (range: [number, number]) => {
    latency = range;
  },
  /** Test hook: the next call of `op` fails with a `forced` error. */
  failNext: (op: ClinicOp) => {
    failures.add(op);
  },
  takeFailure: (op: ClinicOp) => failures.delete(op),
};
