# Clinic example pages — Plan A: mock backend, queries, Patients list — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the foundation for the clinic example pages:
- **Mock backend:** a deterministic clinic seed and an in-memory store that persists for the session and enforces the clinic's rules.
- **Handlers and hooks:** handlers in the repo's `{ queryKey, request }` shape, plus react-query hooks for every later page.
- **First page:** the Patients list, with its route and sidebar entry.

**Architecture:**
- **`src/api/clinic/`** is the mock backend, the only layer a real API replaces:
  - `types.ts` and `calc.ts`
  - `rng.ts` and `seed.ts`: seed data generated from a fixed date and seed
  - `store.ts`: data, persistence, clock, latency and the failure hook
  - `service.ts`: async operations with their rules
  - `handlers/`: thin `{ queryKey, request }` wrappers
- **`src/pages/clinic/queries.ts`** wraps the handlers in react-query hooks. Any write invalidates every `clinic` query.
- **Patients page** is `src/pages/clinic/patients/PatientsPage.tsx`.

**Tech Stack:** React 18, @tanstack/react-query 4, @tanstack/react-table 8, date-fns 4, react-router 6, nuqs, react-i18next, Vitest + Testing Library (happy-dom).

**Spec:** `docs/superpowers/specs/2026-10-16-example-pages-design.md`

## Global Constraints

- Semantic tokens only; the forbidden-pattern baseline stays `{}`. No coloured side stripes. Every field keeps Input's height. Graphite Instrument look with the Oxblood accent.
- English and Arabic for all copy, in a new `clinic` namespace in `src/locales/{en,ar}`. RTL-correct, LTR-isolated values, Western digits. Money goes through `formatMoney`/`useMoneyFormat`, and dates through `useDate`.
- Every query renders four states: skeleton, empty (EmptyState with an action), error (Alert with Retry) and data.
- Responsive down to 390 px: tables scroll horizontally.
- Production code never imports `@component-docs/*`. No new dependencies.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. `P() { corepack pnpm@10.34.7 "$@"; }`. Run `tsc` unpiped.

## Rulings (decided here)

- **Routes per plan:** each plan adds its own routes and sidebar entries. Plan A adds only `/patients`. A row click goes to `/patients/:id` and "New patient" goes to `/patients/new`; both routes arrive in Plans C and D, so until then they hit the 404 page. The branch is unmerged, so nobody ships the gap.
- **Visit volume:** visits are denser within ±7 days of today, so the scheduler always looks busy, and sparse further out. That gives 100–300 visits in total rather than the spec's "~120". The spec's figure was approximate, and a populated today matters more.
- **Coarse cache invalidation:** every clinic write invalidates every query under `['clinic']`. The dataset is small, and this can't miss a dependent view.
- **Fictional names:** doctors, insurers and patients are invented. No real companies or people appear.
- **Day-stamped seed:** sessionStorage data carries the date it was seeded on. A session that crosses midnight reseeds, so the schedule stays centred on today, and that session's writes are dropped.
- **Week:** the clinic works Saturday to Thursday; Friday is the weekend.

## Review Focus

1. **Corrupt or outdated stored data.** Unparseable JSON, a different `version` or a missing table reseeds instead of crashing. → Task 2 test.
2. **Returned objects leaking into the store.** Mutating what a request returned must not change the store. → Task 2 test.
3. **Two bookings racing for one slot.** Two `createVisit` calls for the same doctor and time, both in flight, produce exactly one booking and one `conflict` error. The rule is checked when the write commits. → Task 2 test.
4. **Arabic.** Patient and doctor names show in Arabic, phone numbers stay left-to-right, and digits stay Western. → Task 4 test.
5. **A failed load can be retried.** After a forced failure the page shows the error Alert, and Retry recovers. → Task 4 test.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/api/clinic/types.ts` | domain types |
| `src/api/clinic/calc.ts` | invoice totals and balance, normalised phone |
| `src/api/clinic/rng.ts` | seeded random |
| `src/api/clinic/time.ts` | `dayKey`, `wallTime`, `addDays`, `isFriday` (local wall-clock helpers) |
| `src/api/clinic/seed.ts` | `createClinicSeed(now)` |
| `src/api/clinic/store.ts` | `clinicStore`: data, clock, latency, failure hook, persistence |
| `src/api/clinic/service.ts` | `clinicService`: async ops with invariants, `ClinicError` |
| `src/api/clinic/handlers/*.ts`, `index.ts` | `{ queryKey, request }` handlers |
| `src/api/clinic/*.test.ts` | seed / store / service tests |
| `src/pages/clinic/queries.ts` (+ test) | react-query hooks |
| `src/pages/clinic/shared/useLocalized.ts` | pick a `Localized` value for the active language |
| `src/pages/clinic/test-utils.tsx` | providers for page tests |
| `src/pages/clinic/patients/PatientsPage.tsx` (+ test) | Patients list |
| `src/routes/routes.ts`, `src/routes/router.tsx` | `/patients` route and menu |
| `src/locales/{en,ar}/clinic.json`, `nav.json` | copy |

---

### Task 1: Types, seeded random and the clinic seed

**Files:**
- Create: `src/api/clinic/{types,calc,rng,time,seed}.ts`
- Test: `src/api/clinic/seed.test.ts`

**Interfaces:**
- Produces:
  - `type Localized = { en: string; ar: string }`
  - The entity types `Doctor`, `Insurer`, `Patient`, `PatientSummary`, `Visit`, `VisitType`, `VisitStatus`, `LeaveDay`, `Invoice`, `InvoiceStatus`, `InvoiceLine`, `Payment`, `PaymentMethod`, `DailyMetric`, `ClinicData`, `Allergy` (fields below)
  - `invoiceTotal(i)`, `invoicePaid(i)`, `invoiceBalance(i)`, `normalizePhone(p)`
  - `dayKey(date: Date)`, `wallTime(dayKey, minutes)`, `shiftDay(dayKey, n)`, `isFriday(dayKey)`, `SERVICE_PRICES`
  - `createClinicSeed(now: Date, seed?: number): ClinicData`

- [ ] **Step 1: Write the failing test** (`seed.test.ts`)

```ts
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

  it('never double-books a doctor, and books nothing on Fridays or leave days', () => {
    const { visits, leave } = createClinicSeed(NOW);
    const byDoctor = new Map<string, typeof visits>();
    for (const visit of visits) byDoctor.set(visit.doctorId, [...(byDoctor.get(visit.doctorId) ?? []), visit]);
    for (const list of byDoctor.values()) {
      const sorted = [...list].sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
      for (let i = 1; i < sorted.length; i += 1) expect(Date.parse(sorted[i].start)).toBeGreaterThanOrEqual(Date.parse(sorted[i - 1].end));
    }
    expect(visits.some((v) => isFriday(v.start.slice(0, 10)))).toBe(false);
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
```

- [ ] **Step 2: Run** — `P exec vp test --run src/api/clinic/seed.test.ts`. Expected: FAIL (cannot resolve `./seed`).

- [ ] **Step 3: Implement**

`types.ts`:

```ts
export type Localized = { en: string; ar: string };

export type Doctor = { id: string; name: Localized; specialty: Localized };
export type Insurer = { id: string; name: Localized };
export type Allergy = 'penicillin' | 'latex' | 'peanuts' | 'aspirin' | 'pollen';

export type Patient = {
  id: string;
  mrn: string;
  name: Localized;
  sex: 'female' | 'male';
  dob: string;
  phone: string;
  email: string | null;
  insurerId: string | null;
  policyNumber: string | null;
  allergies: Allergy[];
  primaryDoctorId: string;
  createdAt: string;
};

/** A patient with figures joined from visits and invoices (what list and profile pages show). */
export type PatientSummary = Patient & { lastVisit: string | null; nextVisit: string | null; balance: number };

export type VisitType = 'consultation' | 'follow-up' | 'procedure' | 'check-up';
export type VisitStatus = 'scheduled' | 'arrived' | 'completed' | 'no-show' | 'cancelled';
export type Visit = {
  id: string;
  patientId: string;
  doctorId: string;
  start: string;
  end: string;
  type: VisitType;
  status: VisitStatus;
  notes: string | null;
};

export type LeaveDay = { id: string; doctorId: string; date: string; reason: 'leave' | 'conference' };

export type InvoiceStatus = 'draft' | 'sent' | 'overdue' | 'paid' | 'void';
export type PaymentMethod = 'cash' | 'card' | 'insurance';
export type InvoiceLine = { id: string; service: VisitType; quantity: number; unitPrice: number };
export type Payment = { id: string; amount: number; method: PaymentMethod; date: string };
export type Invoice = {
  id: string;
  number: string;
  patientId: string;
  visitId: string | null;
  issuedAt: string;
  dueAt: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  payments: Payment[];
};

export type DailyMetric = {
  date: string;
  visits: number;
  completed: number;
  noShows: number;
  newPatients: number;
  revenue: number;
  revenueByDoctor: Record<string, number>;
  insured: number;
  selfPay: number;
};

export type ClinicData = {
  version: 1;
  seededOn: string;
  doctors: Doctor[];
  insurers: Insurer[];
  patients: Patient[];
  visits: Visit[];
  leave: LeaveDay[];
  invoices: Invoice[];
  metrics: DailyMetric[];
};
```

`calc.ts`:

```ts
import type { Invoice } from './types';

const cents = (value: number) => Math.round(value * 100) / 100;

export const invoiceTotal = (invoice: Invoice) => cents(invoice.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0));
export const invoicePaid = (invoice: Invoice) => cents(invoice.payments.reduce((sum, payment) => sum + payment.amount, 0));
export const invoiceBalance = (invoice: Invoice) => (invoice.status === 'void' ? 0 : cents(invoiceTotal(invoice) - invoicePaid(invoice)));

/** Digits only, so "+962 79 101 2345" and "0791012345" compare by the subscriber number. */
export const normalizePhone = (phone: string) => phone.replace(/\D/g, '').replace(/^(962|0)/, '');
```

`rng.ts` (mulberry32):

```ts
export const createRandom = (seed: number) => {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(items: readonly T[]) => items[Math.floor(next() * items.length)],
    chance: (probability: number) => next() < probability,
  };
};

export type Random = ReturnType<typeof createRandom>;
```

`time.ts`:

```ts
import { format } from 'date-fns';

export const dayKey = (date: Date) => format(date, 'yyyy-MM-dd');

const fromKey = (key: string, minutes = 0) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 0, minutes);
};

/** Local wall time as an offset ISO string, built from wall-clock parts (DST-safe). */
export const wallTime = (key: string, minutes: number) => format(fromKey(key, minutes), "yyyy-MM-dd'T'HH:mm:ssxxx");
export const shiftDay = (key: string, days: number) => dayKey(new Date(fromKey(key).getFullYear(), fromKey(key).getMonth(), fromKey(key).getDate() + days));
export const isFriday = (key: string) => fromKey(key).getDay() === 5;
```

`seed.ts`:

```ts
import { createRandom, type Random } from './rng';
import { dayKey, isFriday, shiftDay, wallTime } from './time';
import { invoiceTotal } from './calc';
import type { Allergy, ClinicData, DailyMetric, Doctor, Insurer, Invoice, LeaveDay, Patient, Visit, VisitStatus, VisitType } from './types';

export const SERVICE_PRICES: Record<VisitType, number> = { consultation: 40, 'follow-up': 25, procedure: 120, 'check-up': 35 };
const DURATIONS: Record<VisitType, number> = { consultation: 30, 'follow-up': 30, procedure: 60, 'check-up': 45 };
const VISIT_TYPES: VisitType[] = ['consultation', 'follow-up', 'follow-up', 'procedure', 'check-up'];
const WINDOWS = [
  [8 * 60, 12 * 60],
  [13 * 60, 17 * 60],
] as const;

const DOCTORS: Doctor[] = [
  { id: 'dr-haddad', name: { en: 'Dr. Lina Haddad', ar: 'د. لينا حداد' }, specialty: { en: 'General practice', ar: 'طب عام' } },
  { id: 'dr-khalil', name: { en: 'Dr. Omar Khalil', ar: 'د. عمر خليل' }, specialty: { en: 'Pediatrics', ar: 'طب الأطفال' } },
  { id: 'dr-nasser', name: { en: 'Dr. Rania Nasser', ar: 'د. رانيا ناصر' }, specialty: { en: 'Cardiology', ar: 'أمراض القلب' } },
  { id: 'dr-odeh', name: { en: 'Dr. Sami Odeh', ar: 'د. سامي عودة' }, specialty: { en: 'Dermatology', ar: 'الأمراض الجلدية' } },
];

const INSURERS: Insurer[] = [
  { id: 'al-noor', name: { en: 'Al-Noor Insurance', ar: 'النور للتأمين' } },
  { id: 'petra', name: { en: 'Petra Health', ar: 'البتراء الصحية' } },
  { id: 'levant', name: { en: 'Levant Mutual', ar: 'المشرق التبادلي' } },
];

const FIRST: { en: string; ar: string; sex: 'female' | 'male' }[] = [
  { en: 'Sara', ar: 'سارة', sex: 'female' }, { en: 'Omar', ar: 'عمر', sex: 'male' }, { en: 'Lina', ar: 'لينا', sex: 'female' },
  { en: 'Yousef', ar: 'يوسف', sex: 'male' }, { en: 'Maya', ar: 'مايا', sex: 'female' }, { en: 'Rami', ar: 'رامي', sex: 'male' },
  { en: 'Hala', ar: 'هالة', sex: 'female' }, { en: 'Khaled', ar: 'خالد', sex: 'male' }, { en: 'Noor', ar: 'نور', sex: 'female' },
  { en: 'Ahmad', ar: 'أحمد', sex: 'male' }, { en: 'Dana', ar: 'دانا', sex: 'female' }, { en: 'Tariq', ar: 'طارق', sex: 'male' },
  { en: 'Rasha', ar: 'رشا', sex: 'female' }, { en: 'Faris', ar: 'فارس', sex: 'male' }, { en: 'Jana', ar: 'جنى', sex: 'female' },
  { en: 'Zaid', ar: 'زيد', sex: 'male' },
];
const LAST: { en: string; ar: string }[] = [
  { en: 'Haddad', ar: 'حداد' }, { en: 'Khalil', ar: 'خليل' }, { en: 'Nasser', ar: 'ناصر' }, { en: 'Amin', ar: 'أمين' },
  { en: 'Saleh', ar: 'صالح' }, { en: 'Odeh', ar: 'عودة' }, { en: 'Fares', ar: 'فارس' }, { en: 'Majali', ar: 'المجالي' },
  { en: 'Qasem', ar: 'قاسم' }, { en: 'Zoubi', ar: 'الزعبي' }, { en: 'Hijazi', ar: 'حجازي' }, { en: 'Shami', ar: 'الشامي' },
];
const ALLERGIES: Allergy[] = ['penicillin', 'latex', 'peanuts', 'aspirin', 'pollen'];

const pad = (value: number, length: number) => String(value).padStart(length, '0');

function createPatients(rng: Random, today: string): Patient[] {
  return Array.from({ length: 60 }, (_, index) => {
    const first = rng.pick(FIRST);
    const last = rng.pick(LAST);
    const insured = rng.chance(0.7);
    const allergies = ALLERGIES.filter(() => rng.chance(0.15)).slice(0, 2);
    return {
      id: `pt-${pad(index + 1, 3)}`,
      mrn: `MRN-${10001 + index}`,
      name: { en: `${first.en} ${last.en}`, ar: `${first.ar} ${last.ar}` },
      sex: first.sex,
      dob: `${rng.int(1950, 2020)}-${pad(rng.int(1, 12), 2)}-${pad(rng.int(1, 28), 2)}`,
      phone: `+962 7${rng.pick([7, 8, 9])} ${pad(100 + index, 3)} ${pad(rng.int(1000, 9999), 4)}`,
      email: rng.chance(0.6) ? `${first.en.toLowerCase()}.${last.en.toLowerCase()}${index + 1}@example.com` : null,
      insurerId: insured ? rng.pick(INSURERS).id : null,
      policyNumber: insured ? `POL-${rng.int(100000, 999999)}` : null,
      allergies,
      primaryDoctorId: rng.pick(DOCTORS).id,
      createdAt: wallTime(shiftDay(today, -rng.int(1, 400)), 10 * 60),
    };
  });
}

function createLeave(today: string): LeaveDay[] {
  const workday = (offset: number) => {
    let key = shiftDay(today, offset);
    while (isFriday(key)) key = shiftDay(key, 1);
    return key;
  };
  return [
    { id: 'leave-1', doctorId: 'dr-khalil', date: workday(3), reason: 'leave' },
    { id: 'leave-2', doctorId: 'dr-odeh', date: workday(-5), reason: 'conference' },
  ];
}

function statusFor(rng: Random, start: string, end: string, now: Date): VisitStatus {
  if (Date.parse(start) > now.getTime()) return 'scheduled';
  if (Date.parse(end) > now.getTime()) return 'arrived';
  const roll = rng.next();
  return roll < 0.85 ? 'completed' : roll < 0.95 ? 'no-show' : 'cancelled';
}

function createVisits(rng: Random, today: string, now: Date, patients: Patient[], leave: LeaveDay[]): Visit[] {
  const visits: Visit[] = [];
  for (let offset = -21; offset <= 21; offset += 1) {
    const key = shiftDay(today, offset);
    if (isFriday(key)) continue;
    for (const doctor of DOCTORS) {
      if (leave.some((day) => day.doctorId === doctor.id && day.date === key)) continue;
      const wanted = Math.abs(offset) <= 7 ? rng.int(2, 4) : rng.int(0, 2);
      const taken: [number, number][] = [];
      for (let attempt = 0; attempt < 20 && taken.length < wanted; attempt += 1) {
        const type = rng.pick(VISIT_TYPES);
        const [from, to] = rng.pick(WINDOWS);
        const start = from + rng.int(0, (to - from - DURATIONS[type]) / 15) * 15;
        const end = start + DURATIONS[type];
        if (taken.some(([a, b]) => start < b && end > a)) continue;
        taken.push([start, end]);
        const startIso = wallTime(key, start);
        const endIso = wallTime(key, end);
        visits.push({
          id: `vs-${pad(visits.length + 1, 4)}`,
          patientId: rng.pick(patients).id,
          doctorId: doctor.id,
          start: startIso,
          end: endIso,
          type,
          status: statusFor(rng, startIso, endIso, now),
          notes: null,
        });
      }
    }
  }
  return visits.sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}

function createInvoices(rng: Random, today: string, visits: Visit[], patients: Patient[]): Invoice[] {
  const invoices: Invoice[] = [];
  for (const visit of visits.filter((v) => v.status === 'completed')) {
    const issuedAt = visit.start.slice(0, 10);
    const dueAt = shiftDay(issuedAt, 14);
    const lines = [{ id: `ln-${invoices.length + 1}-1`, service: visit.type, quantity: 1, unitPrice: SERVICE_PRICES[visit.type] }];
    if (rng.chance(0.25)) lines.push({ id: `ln-${invoices.length + 1}-2`, service: 'procedure', quantity: 1, unitPrice: 80 });
    const invoice: Invoice = {
      id: `inv-${pad(invoices.length + 1, 4)}`,
      number: '',
      patientId: visit.patientId,
      visitId: visit.id,
      issuedAt,
      dueAt,
      status: 'sent',
      lines,
      payments: [],
    };
    const insured = !!patients.find((p) => p.id === visit.patientId)?.insurerId;
    const method = insured ? 'insurance' : rng.pick(['cash', 'card'] as const);
    const roll = rng.next();
    if (issuedAt >= shiftDay(today, -2) && roll < 0.5) invoice.status = 'draft';
    else if (roll < 0.04) invoice.status = 'void';
    else if (roll < 0.62) {
      invoice.status = 'paid';
      invoice.payments.push({ id: `pay-${invoice.id}`, amount: invoiceTotal(invoice), method, date: shiftDay(issuedAt, rng.int(0, 10)) });
    } else {
      if (rng.chance(0.25)) invoice.payments.push({ id: `pay-${invoice.id}`, amount: Math.floor(invoiceTotal(invoice) / 2), method, date: shiftDay(issuedAt, 3) });
      invoice.status = dueAt < today ? 'overdue' : 'sent';
    }
    invoices.push(invoice);
  }
  invoices.sort((a, b) => a.issuedAt.localeCompare(b.issuedAt) || a.id.localeCompare(b.id));
  invoices.forEach((invoice, index) => (invoice.number = `INV-${invoice.issuedAt.slice(0, 4)}-${pad(index + 1, 4)}`));
  return invoices;
}

function createMetrics(rng: Random, today: string): DailyMetric[] {
  return Array.from({ length: 90 }, (_, index) => {
    const daysAgo = 90 - index;
    const trend = Math.floor(index / 15);
    const visits = rng.int(18, 30) + trend;
    const noShows = rng.int(0, 4);
    const completed = visits - noShows;
    const revenueByDoctor = Object.fromEntries(DOCTORS.map((doctor) => [doctor.id, rng.int(30, 90) * 5 + trend * 10]));
    const insured = Math.round(completed * (0.5 + rng.next() * 0.25));
    return {
      date: shiftDay(today, -daysAgo),
      visits,
      completed,
      noShows,
      newPatients: rng.int(0, 4),
      revenue: Object.values(revenueByDoctor).reduce((sum, value) => sum + value, 0),
      revenueByDoctor,
      insured,
      selfPay: completed - insured,
    };
  });
}

/** The whole clinic, generated around `now` from a fixed seed: the same date always gives the same data. */
export function createClinicSeed(now: Date, seed = 20261016): ClinicData {
  const rng = createRandom(seed);
  const today = dayKey(now);
  const patients = createPatients(rng, today);
  const leave = createLeave(today);
  const visits = createVisits(rng, today, now, patients, leave);
  const invoices = createInvoices(rng, today, visits, patients);
  return {
    version: 1,
    seededOn: today,
    doctors: DOCTORS,
    insurers: INSURERS,
    patients,
    visits,
    leave,
    invoices,
    metrics: createMetrics(rng, today),
  };
}
```

- [ ] **Step 4: Run** — Expected: PASS. Also run with `TZ=Europe/Berlin` and `TZ=America/New_York`: PASS.
- [ ] **Step 5: Commit** — `feat(clinic): deterministic clinic seed — doctors, patients, visits, leave, invoices, metrics`

---

### Task 2: Store and service — persistence, clock, latency, rules

**Files:**
- Create: `src/api/clinic/store.ts`, `src/api/clinic/service.ts`
- Test: `src/api/clinic/store.test.ts`, `src/api/clinic/service.test.ts`

**Interfaces:**
- Produces `clinicStore`:
  - `read(): ClinicData`
  - `write(mutate)`
  - `reset(now?: Date)`
  - `now(): Date` and `setClock(fn | null)`
  - `setLatency([min, max])`
  - `failNext(op: ClinicOp)`
  - `takeFailure(op): boolean`
  - `STORAGE_KEY = 'rsk:clinic:v1'`
- Produces `class ClinicError extends Error { code: 'conflict' | 'not-found' | 'invalid-transition' | 'duplicate-phone' | 'forced' | 'invalid'; fieldErrors?: Record<string, string> }`
- Produces `clinicService` (every method async), grouped:
  - **Reference lists:** `listDoctors()`, `listInsurers()`
  - **Patients:** `listPatients(): PatientSummary[]`, `getPatient(id)`, `registerPatient(input: NewPatientInput): Patient`
  - **Visits:**
    - `listVisits({ from, to })` and `listLeave({ from, to })` (dayKeys, inclusive)
    - `createVisit(input: NewVisitInput): Visit`
    - `updateVisit(id, { start, end, doctorId }): Visit`
    - `setVisitStatus(id, status)`
  - **Invoices:**
    - `listInvoices()`, `getInvoice(id)`
    - `recordPayment(id, { amount, method, date })`, `sendInvoice(id)`, `voidInvoice(id)`
    - `bulkInvoices(ids, action: 'mark-paid' | 'send-reminder'): { done: string[]; skipped: { id: string; reason: 'not-allowed' }[] }`
  - **Metrics:** `listMetrics(days: 7 | 30 | 90)`
- `ClinicOp` is the method name (`'listPatients'` etc.).
- `NewPatientInput = Omit<Patient, 'id' | 'mrn' | 'createdAt'>`
- `NewVisitInput = Omit<Visit, 'id' | 'status' | 'notes'> & { notes?: string | null }`

Rules:
- **Visits:** a visit conflicts with another visit of the same doctor that isn't cancelled, or with that doctor's leave day. The check runs when the write commits, after latency.
- **Phone numbers:** a duplicate phone (compared with `normalizePhone`) gives `ClinicError('duplicate-phone', …, { phone: 'duplicate-phone' })`.
- **Recording a payment:** allowed only on `sent` or `overdue` invoices, with `0 < amount <= balance`. When the balance reaches 0, the invoice becomes `paid`.
- **Invoice transitions:** `sendInvoice` only from `draft`; `voidInvoice` from anything except `paid`.
- **Bulk actions:**
  - `mark-paid` works on `sent` or `overdue`: it records the balance as a `card` payment dated today and sets `paid`.
  - `send-reminder` works on `sent` or `overdue` and changes nothing.
  - Anything else is skipped as `not-allowed`.
- **Patient summaries:**
  - `lastVisit` is the latest `completed` visit start up to now.
  - `nextVisit` is the earliest `scheduled` start after now.
  - `balance` sums `invoiceBalance` over the patient's `sent` and `overdue` invoices.
  - The list is sorted by `name.en`.
- **New records:**
  - New ids are `pt-new-<n>` and `vs-new-<n>`.
  - MRNs continue from the highest one.
  - `createdAt` is `clinicStore.now()` as an offset ISO string.

- [ ] **Step 1: Write the failing tests**

`store.test.ts`:

```ts
// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { clinicStore, STORAGE_KEY } from './store';

const NOW = new Date(2026, 9, 16, 9, 0);

beforeEach(() => {
  sessionStorage.clear();
  clinicStore.setClock(() => NOW);
  clinicStore.reset();
});

afterEach(() => clinicStore.setClock(null));

describe('clinicStore persistence', () => {
  it('persists writes to sessionStorage and reads them back after a reload', () => {
    clinicStore.write((data) => {
      data.patients[0].phone = '+962 79 999 0000';
    });
    clinicStore.reload();
    expect(clinicStore.read().patients[0].phone).toBe('+962 79 999 0000');
  });

  it.each([['{not json'], [JSON.stringify({ version: 0 })], [JSON.stringify({ version: 1, seededOn: '2026-10-16' })]])(
    'reseeds instead of crashing on stored data %s',
    (raw) => {
      sessionStorage.setItem(STORAGE_KEY, raw);
      clinicStore.reload();
      expect(clinicStore.read().patients).toHaveLength(60);
    },
  );

  it('reseeds when the stored data was seeded on another day', () => {
    clinicStore.write((data) => {
      data.patients[0].phone = '+962 79 999 0000';
    });
    clinicStore.setClock(() => new Date(2026, 9, 17, 9, 0));
    clinicStore.reload();
    expect(clinicStore.read().seededOn).toBe('2026-10-17');
    expect(clinicStore.read().patients[0].phone).not.toBe('+962 79 999 0000');
  });

  it('fails an operation once when asked to', () => {
    clinicStore.failNext('listPatients');
    expect(clinicStore.takeFailure('listPatients')).toBe(true);
    expect(clinicStore.takeFailure('listPatients')).toBe(false);
  });
});
```

`service.test.ts`:

```ts
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
    expect(patients.map((p) => p.name.en)).toEqual([...patients.map((p) => p.name.en)].sort((a, b) => a.localeCompare(b)));
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
      clinicService.createVisit({ patientId: 'pt-001', doctorId: 'dr-khalil', type: 'consultation', start: wallTime(leave.date, 600), end: wallTime(leave.date, 630) }),
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
    await expect(clinicService.recordPayment(invoice.id, { amount: 1, method: 'cash', date: today })).rejects.toMatchObject({ code: 'invalid-transition' });
  });

  it('refuses overpayments, voiding a paid invoice and sending a sent one', async () => {
    const sent = clinicStore.read().invoices.find((i) => i.status === 'sent')!;
    await expect(clinicService.recordPayment(sent.id, { amount: invoiceBalance(sent) + 1, method: 'cash', date: today })).rejects.toMatchObject({ code: 'invalid' });
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
```

- [ ] **Step 2: Run** — Expected: FAIL (modules missing).

- [ ] **Step 3: Implement**

`store.ts`:

```ts
import { createClinicSeed } from './seed';
import { dayKey } from './time';
import type { ClinicData } from './types';

export const STORAGE_KEY = 'rsk:clinic:v1';

export type ClinicOp =
  | 'listDoctors' | 'listInsurers' | 'listPatients' | 'getPatient' | 'registerPatient'
  | 'listVisits' | 'listLeave' | 'createVisit' | 'updateVisit' | 'setVisitStatus'
  | 'listInvoices' | 'getInvoice' | 'recordPayment' | 'sendInvoice' | 'voidInvoice' | 'bulkInvoices' | 'listMetrics';

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
```

`service.ts`:

```ts
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
  const last = visits.filter((v) => v.status === 'completed' && Date.parse(v.start) <= now).sort((a, b) => Date.parse(b.start) - Date.parse(a.start))[0];
  const next = visits.filter((v) => v.status === 'scheduled' && Date.parse(v.start) > now).sort((a, b) => Date.parse(a.start) - Date.parse(b.start))[0];
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

let sequence = 0;

export const clinicService = {
  listDoctors: () => request('listDoctors', (data) => data.doctors),
  listInsurers: () => request('listInsurers', (data) => data.insurers),

  listPatients: () =>
    request('listPatients', (data) => data.patients.map((patient) => summarize(data, patient)).sort((a, b) => a.name.en.localeCompare(b.name.en))),

  getPatient: (id: string) => request('getPatient', (data) => summarize(data, find(data.patients, id, 'Patient'))),

  registerPatient: (input: NewPatientInput) =>
    mutation('registerPatient', (data) => {
      if (data.patients.some((patient) => normalizePhone(patient.phone) === normalizePhone(input.phone))) {
        throw new ClinicError('duplicate-phone', 'A patient with this phone already exists', { phone: 'duplicate-phone' });
      }
      const nextMrn = Math.max(...data.patients.map((patient) => Number(patient.mrn.replace('MRN-', '')))) + 1;
      const patient: Patient = { ...input, id: `pt-new-${(sequence += 1)}`, mrn: `MRN-${nextMrn}`, createdAt: nowIso() };
      data.patients.push(patient);
      return patient;
    }),

  listVisits: (range: DayRange) => request('listVisits', (data) => data.visits.filter((visit) => inRange(visit.start.slice(0, 10), range))),
  listLeave: (range: DayRange) => request('listLeave', (data) => data.leave.filter((day) => inRange(day.date, range))),

  createVisit: (input: NewVisitInput) =>
    mutation('createVisit', (data) => {
      find(data.patients, input.patientId, 'Patient');
      assertFree(data, input.doctorId, input.start, input.end);
      const visit: Visit = { ...input, notes: input.notes ?? null, id: `vs-new-${(sequence += 1)}`, status: 'scheduled' };
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
      if (!(payment.amount > 0) || payment.amount > invoiceBalance(invoice)) throw new ClinicError('invalid', 'The amount must be above 0 and at most the balance');
      invoice.payments.push({ id: `pay-new-${(sequence += 1)}`, ...payment });
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
          invoice.payments.push({ id: `pay-new-${(sequence += 1)}`, amount: invoiceBalance(invoice), method: 'card', date: dayKey(clinicStore.now()) });
          invoice.status = 'paid';
        }
        result.done.push(id);
      }
      return result;
    }),

  listMetrics: (days: 7 | 30 | 90) => request('listMetrics', (data): DailyMetric[] => data.metrics.slice(-days)),
};
```

- [ ] **Step 4: Run** both test files. Expected: PASS.
- [ ] **Step 5: Commit** — `feat(clinic): session store and service — persistence, latency, failure hook, booking and invoice rules`

---

### Task 3: Handlers and query hooks

**Files:**
- Create: `src/api/clinic/handlers/{patients,visits,invoices,metrics,reference}.ts`, `src/api/clinic/handlers/index.ts`, `src/api/clinic/index.ts`
- Create: `src/pages/clinic/queries.ts`, `src/pages/clinic/shared/useLocalized.ts`, `src/pages/clinic/test-utils.tsx`
- Test: `src/pages/clinic/queries.test.tsx`

**Interfaces:**
- **Handlers** (each query is `{ queryKey: 'clinic/…', request }`, each mutation is `{ request }`):
  - `ClinicReferenceHandler.{ doctors, insurers }`
  - `PatientsHandler.{ list, get, register }`
  - `VisitsHandler.{ list, leave, create, update, setStatus }`
  - `InvoicesHandler.{ list, get, recordPayment, send, void, bulk }`
  - `MetricsHandler.{ list }`
- `src/api/clinic/index.ts` re-exports the handlers, types, `ClinicError`, `invoiceTotal`/`invoicePaid`/`invoiceBalance` and `clinicStore`. The store is exported only for tests and the dev reset.
- **Query hooks** (`queries.ts`):
  - `useDoctors()`, `useInsurers()`
  - `usePatients()`, `usePatient(id)`
  - `useVisits(range)`, `useLeave(range)`
  - `useInvoices()`, `useInvoice(id)`
  - `useMetrics(days)`
- **Mutation hooks** (`queries.ts`), each invalidating `['clinic']` when it settles: `useRegisterPatient()`, `useCreateVisit()`, `useUpdateVisit()`, `useSetVisitStatus()`, `useRecordPayment()`, `useSendInvoice()`, `useVoidInvoice()`, `useBulkInvoices()`.
- Query keys are `['clinic', handler.queryKey, ...params]`.
- `useLocalized(): (value: Localized) => string` returns `ar` when the language is Arabic and `en` otherwise.
- `renderClinic(ui, { route = '/', path = '*' })` wraps `ui` in:
  - `NuqsTestingAdapter`
  - a fresh `QueryClient` (retry off, cacheTime 0)
  - `Tooltip.Provider`
  - `MemoryRouter` at `route`, with `<Routes><Route path={path} element={ui} /><Route path="*" element={<LocationProbe />} /></Routes>`
  - `LocationProbe` renders `<output data-testid="location">{pathname}{search}</output>`
- `resetClinic()` (test utility) does: `sessionStorage.clear()`, a fixed clock at 2026-10-16 09:00, latency `[0, 0]`, `clinicStore.reset()`.

- [ ] **Step 1: Write the failing test** (`queries.test.tsx`)

```tsx
// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { clinicStore } from '@api/clinic';

import { usePatients, useRegisterPatient } from './queries';
import { resetClinic } from './test-utils';

beforeEach(resetClinic);
afterEach(() => clinicStore.setClock(null));

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
);

describe('clinic queries', () => {
  it('loads patients through the handlers', async () => {
    const { result } = renderHook(() => usePatients(), { wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(60));
  });

  it('refreshes the patient list after a registration', async () => {
    const { result } = renderHook(() => ({ list: usePatients(), register: useRegisterPatient() }), { wrapper });
    await waitFor(() => expect(result.current.list.data).toHaveLength(60));
    const template = clinicStore.read().patients[0];
    await act(async () => {
      await result.current.register.mutateAsync({ ...template, phone: '+962 79 000 0001' });
    });
    await waitFor(() => expect(result.current.list.data).toHaveLength(61));
  });

  it('surfaces a ClinicError from a failed request', async () => {
    clinicStore.failNext('listPatients');
    const { result } = renderHook(() => usePatients(), { wrapper });
    await waitFor(() => expect(result.current.error).toMatchObject({ code: 'forced' }));
  });
});
```

- [ ] **Step 2: Run** — Expected: FAIL (modules missing).
- [ ] **Step 3: Implement.**
  - Handlers follow the existing `DoctorsHandler` shape, but `request` calls `clinicService` instead of `httpClient`. Example:

```ts
import { clinicService, type NewPatientInput } from '../service';

export const PatientsHandler = {
  list: { queryKey: 'clinic/patients/list', request: () => clinicService.listPatients() },
  get: { queryKey: 'clinic/patients/get', request: (id: string) => clinicService.getPatient(id) },
  register: { request: (input: NewPatientInput) => clinicService.registerPatient(input) },
} as const;
```

  - `queries.ts` pattern:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type DayRange, PatientsHandler /* … */ } from '@api/clinic';

const CLINIC = 'clinic';

export const usePatients = () => useQuery([CLINIC, PatientsHandler.list.queryKey], PatientsHandler.list.request);
export const usePatient = (id: string) => useQuery([CLINIC, PatientsHandler.get.queryKey, id], () => PatientsHandler.get.request(id));

/** Every clinic write refreshes every clinic view: the dataset is small and nothing can go stale. */
const useClinicMutation = <TInput, TResult>(request: (input: TInput) => Promise<TResult>) => {
  const client = useQueryClient();
  return useMutation(request, { onSettled: () => client.invalidateQueries([CLINIC]) });
};

export const useRegisterPatient = () => useClinicMutation(PatientsHandler.register.request);
export const useUpdateVisit = () =>
  useClinicMutation(({ id, patch }: { id: string; patch: VisitPatch }) => VisitsHandler.update.request(id, patch));
// …and the rest, same pattern
```

- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** — `feat(clinic): clinic handlers and react-query hooks with clinic-wide invalidation`

---

### Task 4: Patients page, route and sidebar

**Files:**
- Create: `src/pages/clinic/patients/PatientsPage.tsx`, `src/locales/{en,ar}/clinic.json`
- Modify: `src/routes/routes.ts` (`FULL_ROUTES_PATH.PATIENTS = { INDEX: '/patients', NEW: '/patients/new', DETAIL: '/patients/:id' }`, `patientPath(id)`, menu entry `patients` with the lucide `Contact` icon after Dashboard), `src/routes/router.tsx` (lazy `PatientsPage` at `/patients`), `src/locales/{en,ar}/nav.json` (`patients`: "Patients" / "المرضى")
- Test: `src/pages/clinic/patients/PatientsPage.test.tsx`

**Page:**
- **Header:** `PageHeader` with title "Patients", a description, and an action `<Button asChild><Link to="/patients/new">New patient</Link></Button>`.
- **Load error:** a danger `Alert` with the title "Patients couldn't be loaded", a description, and a "Retry" button that calls `refetch`.
- **Empty clinic** (loaded with zero patients): `EmptyState kind="first-use"` with a "New patient" action.
- **Table:** a `DataTable` with `isLoading`, filters through `useDataTableFilters({ columns, urlSync: true, storageKey: 'clinic-patients' })`, global search, sorting and page size 10. `onRowClick` navigates to `patientPath(id)`, and `getRowClassName` adds `cursor-pointer`.
- **Columns** (copy in the `clinic` namespace under `patients.*`):

| Column | Shows | Filter and sorting |
|---|---|---|
| **Name** | `accessorFn` is the localized name. The cell shows the name in medium weight, with the MRN muted below (`dir="ltr"`). | sortable, `containsFilterFn` |
| **MRN** | `accessorKey` `mrn`, LTR | none |
| **Phone** | `<bdi dir="ltr">` | none |
| **Primary doctor** | `accessorKey` `primaryDoctorId`; the cell shows the localized doctor name | `multiSelect` filter with doctor options, `inListFilterFn` |
| **Insurer** | `accessorFn` is `insurerId ?? 'self-pay'`; the cell shows the localized insurer name or "Self-pay" | `multiSelect` with the insurers plus Self-pay |
| **Last visit** | `accessorFn` is `lastVisit?.slice(0, 10) ?? ''`; the cell shows `formatNullableDate(lastVisit, SHORT_MONTH_DAY_YEAR, '—')` with LTR | sortable, `dateRangeFilterFn` |
| **Balance** | the cell uses `<Money value={balance} />` | numeric, sortable |

- **Data dependencies:** doctors and insurers come from `useDoctors` and `useInsurers`. The table renders only once patients load, and the option lists fill in when those queries land. A missing doctor or insurer shows "—".

- [ ] **Step 1: Write the failing tests**

```tsx
// @vitest-environment happy-dom
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { clinicStore } from '@api/clinic';

import i18n from '../../../i18n';
import { renderClinic, resetClinic } from '../test-utils';
import PatientsPage from './PatientsPage';

beforeEach(resetClinic);
afterEach(async () => {
  cleanup();
  clinicStore.setClock(null);
  await act(() => i18n.changeLanguage('en'));
});

const renderPage = () => renderClinic(<PatientsPage />, { route: '/patients', path: '/patients' });
const firstPatient = () => [...clinicStore.read().patients].sort((a, b) => a.name.en.localeCompare(b.name.en))[0];

describe('PatientsPage', () => {
  it('shows a loading table, then patients with their doctor, insurer and balance', async () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Patients' })).toBeTruthy();
    expect(await screen.findByText(firstPatient().name.en)).toBeTruthy();
    const row = screen.getByText(firstPatient().name.en).closest('tr')!;
    expect(within(row).getByText(firstPatient().mrn)).toBeTruthy();
    expect(row.querySelector('bdi[dir="ltr"]')?.textContent).toBe(firstPatient().phone);
  });

  it('opens a patient profile on row click', async () => {
    renderPage();
    fireEvent.click((await screen.findByText(firstPatient().name.en)).closest('tr')!);
    expect(screen.getByTestId('location').textContent).toBe(`/patients/${firstPatient().id}`);
  });

  it('searches by name', async () => {
    renderPage();
    await screen.findByText(firstPatient().name.en);
    fireEvent.change(screen.getByPlaceholderText('Search by name, MRN or phone'), { target: { value: firstPatient().mrn } });
    await waitFor(() => expect(screen.getAllByRole('row').length).toBeLessThanOrEqual(3));
  });

  it('shows an error with Retry, and Retry recovers', async () => {
    clinicStore.failNext('listPatients');
    renderPage();
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain("Patients couldn't be loaded");
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText(firstPatient().name.en)).toBeTruthy();
  });

  it('shows a first-use empty state when the clinic has no patients', async () => {
    clinicStore.write((data) => {
      data.patients = [];
    });
    renderPage();
    expect(await screen.findByText('No patients yet')).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'New patient' }).length).toBeGreaterThan(0);
  });

  it('shows Arabic names and keeps phones left-to-right with Western digits', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderPage();
    const arabicFirst = [...clinicStore.read().patients].sort((a, b) => a.name.en.localeCompare(b.name.en))[0];
    expect(await screen.findByText(arabicFirst.name.ar)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'المرضى' })).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/[٠-٩]/);
  });
});
```

Add to `src/routes` tests (new `src/routes/clinic-routes.test.ts`):

```ts
import { describe, expect, it } from 'vite-plus/test';

import { APP_MENU, FULL_ROUTES_PATH, patientPath } from '@routes';

describe('clinic routes', () => {
  it('adds Patients to the main menu and builds profile paths', () => {
    expect(APP_MENU.find((item) => item.id === 'patients')?.path).toBe('/patients');
    expect(FULL_ROUTES_PATH.PATIENTS.NEW).toBe('/patients/new');
    expect(patientPath('pt-001')).toBe('/patients/pt-001');
  });
});
```

- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** the page, routes, menu and locales:

`clinic.json` (en):

```json
{
  "patients": {
    "title": "Patients",
    "description": "Everyone registered at the clinic.",
    "newPatient": "New patient",
    "searchPlaceholder": "Search by name, MRN or phone",
    "totalLabel": "patients",
    "selfPay": "Self-pay",
    "columns": { "name": "Name", "mrn": "MRN", "phone": "Phone", "doctor": "Primary doctor", "insurer": "Insurer", "lastVisit": "Last visit", "balance": "Balance" },
    "empty": { "title": "No patients yet", "description": "Register the first patient to start booking visits." },
    "noResults": { "title": "No matching patients", "description": "Try another search or clear the filters." },
    "error": { "title": "Patients couldn't be loaded", "description": "Something went wrong. Try again in a moment." }
  },
  "retry": "Retry"
}
```

`clinic.json` (ar):

```json
{
  "patients": {
    "title": "المرضى",
    "description": "جميع المسجّلين في العيادة.",
    "newPatient": "مريض جديد",
    "searchPlaceholder": "ابحث بالاسم أو رقم الملف أو الهاتف",
    "totalLabel": "مريض",
    "selfPay": "دفع ذاتي",
    "columns": { "name": "الاسم", "mrn": "رقم الملف", "phone": "الهاتف", "doctor": "الطبيب المعالج", "insurer": "شركة التأمين", "lastVisit": "آخر زيارة", "balance": "الرصيد" },
    "empty": { "title": "لا يوجد مرضى بعد", "description": "سجّل أول مريض لتبدأ بحجز الزيارات." },
    "noResults": { "title": "لا يوجد مرضى مطابقون", "description": "جرّب بحثًا آخر أو امسح عوامل التصفية." },
    "error": { "title": "تعذّر تحميل المرضى", "description": "حدث خطأ ما. حاول مرة أخرى بعد قليل." }
  },
  "retry": "إعادة المحاولة"
}
```

- [ ] **Step 4: Run** the page and route tests, plus the existing `MembersPage`, `AppLayout` and router tests. Expected: PASS.
- [ ] **Step 5: Commit** — `feat(clinic): Patients list page with route and sidebar entry`

---

### Task 5: Exit — gate and browser check

- [ ] **Step 1:** Run the full gate: `P ds:baseline && P exec vp fmt && P exec vp check && P exec tsc -b && P exec tsc -p tsconfig.scripts.json && P docs:lint && P exec vp test --run src tests && P exec vp build`. Then grep `dist/assets` for `frontmatter`, `DocsLayout`, `recharts` → 0 each, and check that the `clinic` seed is in the production bundle (it should be, since the pages ship).
- [ ] **Step 2: Browser check** on the dev server at `/patients` (you are logged in through the app's AuthGuard; check how the existing pages get past it):
  - **1440 px:** light and dark. Covers loading, then the table, search, the doctor filter and a row click to `/patients/:id`.
  - **390 px:** the table scrolls horizontally.
  - **Arabic:** at 1440 px.

  Fix anything found under TDD.
- [ ] **Step 3: Commit** — `test(clinic): Plan A exit — gate and browser check`
