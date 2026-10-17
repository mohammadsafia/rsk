# Clinic example pages — Plan B: Operations dashboard and Billing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two new pages:
- **Operations dashboard** at `/dashboard`, replacing the generic placeholder: stat cards with trends and sparklines, three charts and today's agenda.
- **Billing** at `/billing`: summary cards, an invoice table with status tabs and bulk actions, and an invoice Sheet with payments.

**Architecture:**
- **Pure maths:** each page keeps its sums in a module under `src/pages/clinic/<page>/`, unit-tested directly.
- **Data:** the pages read only through `src/pages/clinic/queries.ts`, from Plan A.
- **Dashboard:** loads 90 days of metrics once and slices them locally. A trend compares a range with the range of the same length just before it.
- **Billing:** builds table rows by joining invoices with patients. Bulk actions go through `useBulkInvoices`, and the invoice Sheet through `useRecordPayment`, `useSendInvoice` and `useVoidInvoice`.

**Tech Stack:** React 18, react-query 4, @tanstack/react-table 8, recharts 3 (through `@components/charts`), react-hook-form + zod, nuqs, react-i18next, Vitest + Testing Library (happy-dom).

**Spec:** `docs/superpowers/specs/2026-10-16-example-pages-design.md` (Operations dashboard, Billing).

## Global Constraints

- Semantic tokens only; `ds:baseline` stays `{}`. No coloured side stripes. Every field keeps Input's height. Graphite Instrument look, Oxblood accent.
- English and Arabic for all copy, in the `clinic` namespace. RTL-correct, with LTR-isolated values and Western digits. Money goes through `Money`/`useMoneyFormat`, and dates through `useDate`.
- Every query renders four states: skeleton, empty (EmptyState with an action), error (Alert with Retry) and data. Mutations show loading on the button that triggered them and a toast when they finish.
- Responsive down to 390 px: tables scroll horizontally, and the stat and chart grids collapse to one column.
- Production code never imports `@component-docs/*`. No new dependencies.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. `P() { corepack pnpm@10.34.7 "$@"; }`. Run `tsc` unpiped.
- Page tests use `renderClinic` and `resetClinic` from `src/pages/clinic/test-utils.tsx`. The test clock is Friday 16 Oct 2026, 09:00, with latency 0.

## Rulings (decided here)

- **Gate change:** recharts now ships in the production bundle (the dashboard is a real page). The exit gate drops the "no recharts in `dist`" check and keeps `frontmatter` and `DocsLayout` at 0.
- **Old dashboard removed:** `src/pages/dashboard/DashboardPage.tsx`, its test and `src/locales/{en,ar}/dashboard.json` are deleted once nothing else uses that namespace (check with grep first). `/dashboard` then renders `OperationsDashboard`.
- **No trend for 90 days:** the seed holds 90 days of metrics, so a range compares with the previous equal range only when that data exists. The 7- and 30-day ranges get trends; 90 days shows no trend.
- **"New patients" link:** spec'd as `/patients?sort=created`. The Patients page gains a "Registered" column and honours `?sort=created`, which sorts newest first (Task 3).
- **Links to `/schedule`:** they hit the 404 page until Plan C, under the same routes-per-plan ruling as Plan A.
- **Mark paid scope:** "Mark paid" records the outstanding balance as a card payment. Only `sent` and `overdue` invoices qualify, and the store skips the rest.
- **Export CSV** is client-side: a Blob download of the selected rows, comma-separated, quoted, UTF-8 with a BOM so Excel reads Arabic names correctly.

## Review Focus

1. **A range without enough history** (90 days). There is no trend arrow and no NaN or Infinity anywhere. → Task 1 test.
2. **A zero denominator.** A day with 0 visits gives a no-show rate of 0, not NaN. → Task 1 test.
3. **Bulk "Mark paid" over a mixed selection** (paid, void and open invoices). The toast reports done and skipped counts, the selection clears, and the table refreshes. → Task 5 test.
4. **Record payment over the balance, or of 0.** The form blocks it with a field error and never calls the store. → Task 6 test.
5. **CSV with commas, quotes and Arabic names.** Fields are quoted and escaped, and the file starts with a BOM. → Task 4 test.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/pages/clinic/dashboard/metrics.ts` (+ test) | range figures, trends, series, revenue by doctor, payer mix |
| `src/pages/clinic/dashboard/OperationsDashboard.tsx` (+ test) | the page |
| `src/pages/clinic/billing/billing.ts` (+ test) | billing summary, invoice rows, CSV |
| `src/pages/clinic/billing/BillingPage.tsx` (+ test) | summary, tabs, table, bulk actions |
| `src/pages/clinic/billing/InvoiceSheet.tsx` (+ test) | invoice detail, record payment, send, void |
| `src/pages/clinic/shared/status.ts` | invoice and visit status → Badge tone |
| `src/pages/clinic/patients/PatientsPage.tsx` | Registered column, `?sort=created` |
| `src/routes/*`, `src/locales/{en,ar}/{clinic,nav}.json` | `/billing`, menu, copy |

---

### Task 1: Dashboard maths

**Files:**
- Create: `src/pages/clinic/dashboard/metrics.ts`
- Test: `src/pages/clinic/dashboard/metrics.test.ts`

**Interfaces:**
- Produces:
  - `type RangeDays = 7 | 30 | 90`
  - `type Figure = { value: number; trend: number | null; series: { date: string; value: number }[] }`
  - `summarize(metrics: DailyMetric[], days: RangeDays): { visits: Figure; newPatients: Figure; noShowRate: Figure; revenue: Figure }`
  - `visitsSeries(metrics, days): { date: string; completed: number; noShows: number }[]`
  - `revenueByDoctor(metrics, days): { doctorId: string; revenue: number }[]` (sorted by revenue, highest first)
  - `payerMix(metrics, days): { insured: number; selfPay: number }`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vite-plus/test';

import type { DailyMetric } from '@api/clinic';

import { payerMix, revenueByDoctor, summarize, visitsSeries } from './metrics';

const day = (index: number, overrides: Partial<DailyMetric> = {}): DailyMetric => ({
  date: `2026-10-${String(index + 1).padStart(2, '0')}`,
  visits: 10,
  completed: 9,
  noShows: 1,
  newPatients: 2,
  revenue: 100,
  revenueByDoctor: { a: 60, b: 40 },
  insured: 6,
  selfPay: 3,
  ...overrides,
});

describe('dashboard metrics', () => {
  it('sums the range and compares it with the previous range of the same length', () => {
    const metrics = [...Array.from({ length: 7 }, (_, i) => day(i)), ...Array.from({ length: 7 }, (_, i) => day(i + 7, { visits: 15, revenue: 150 }))];
    const figures = summarize(metrics, 7);
    expect(figures.visits.value).toBe(105);
    expect(figures.visits.trend).toBe(50);
    expect(figures.revenue.value).toBe(1050);
    expect(figures.revenue.series).toHaveLength(7);
    expect(figures.newPatients.value).toBe(14);
  });

  it('has no trend when there is no previous range, and never NaN', () => {
    const metrics = Array.from({ length: 7 }, (_, i) => day(i));
    const figures = summarize(metrics, 7);
    expect(figures.visits.trend).toBeNull();
    expect(Object.values(figures).every((figure) => Number.isFinite(figure.value))).toBe(true);
  });

  it('reports a 0% no-show rate for days without visits', () => {
    const metrics = Array.from({ length: 7 }, (_, i) => day(i, { visits: 0, completed: 0, noShows: 0 }));
    const { noShowRate } = summarize(metrics, 7);
    expect(noShowRate.value).toBe(0);
    expect(noShowRate.series.every((point) => point.value === 0)).toBe(true);
  });

  it('builds the visits series, revenue by doctor and payer mix', () => {
    const metrics = Array.from({ length: 7 }, (_, i) => day(i));
    expect(visitsSeries(metrics, 7)[0]).toEqual({ date: '2026-10-01', completed: 9, noShows: 1 });
    expect(revenueByDoctor(metrics, 7)).toEqual([
      { doctorId: 'a', revenue: 420 },
      { doctorId: 'b', revenue: 280 },
    ]);
    expect(payerMix(metrics, 7)).toEqual({ insured: 42, selfPay: 21 });
  });
});
```

- [ ] **Step 2: Run** — `P exec vp test --run src/pages/clinic/dashboard/metrics.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement**

```ts
import type { DailyMetric } from '@api/clinic';

export type RangeDays = 7 | 30 | 90;
export type Point = { date: string; value: number };
export type Figure = { value: number; trend: number | null; series: Point[] };

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const rate = (part: number, whole: number) => (whole > 0 ? part / whole : 0);
const round1 = (value: number) => Math.round(value * 10) / 10;

const windows = (metrics: DailyMetric[], days: RangeDays) => ({
  current: metrics.slice(-days),
  previous: metrics.length >= days * 2 ? metrics.slice(-days * 2, -days) : null,
});

/** Percentage change against the previous range; null without a previous range or with a zero base. */
const trendOf = (current: number, previous: number | null) =>
  previous === null || previous === 0 ? null : round1(((current - previous) / previous) * 100);

const figure = (metrics: DailyMetric[], days: RangeDays, total: (rows: DailyMetric[]) => number, daily: (row: DailyMetric) => number): Figure => {
  const { current, previous } = windows(metrics, days);
  return {
    value: total(current),
    trend: trendOf(total(current), previous ? total(previous) : null),
    series: current.map((row) => ({ date: row.date, value: daily(row) })),
  };
};

export const summarize = (metrics: DailyMetric[], days: RangeDays) => ({
  visits: figure(metrics, days, (rows) => sum(rows.map((r) => r.visits)), (r) => r.visits),
  newPatients: figure(metrics, days, (rows) => sum(rows.map((r) => r.newPatients)), (r) => r.newPatients),
  noShowRate: figure(
    metrics,
    days,
    (rows) => rate(sum(rows.map((r) => r.noShows)), sum(rows.map((r) => r.visits))),
    (r) => rate(r.noShows, r.visits),
  ),
  revenue: figure(metrics, days, (rows) => sum(rows.map((r) => r.revenue)), (r) => r.revenue),
});

export const visitsSeries = (metrics: DailyMetric[], days: RangeDays) =>
  metrics.slice(-days).map((row) => ({ date: row.date, completed: row.completed, noShows: row.noShows }));

export const revenueByDoctor = (metrics: DailyMetric[], days: RangeDays) => {
  const totals = new Map<string, number>();
  for (const row of metrics.slice(-days)) for (const [doctorId, value] of Object.entries(row.revenueByDoctor)) totals.set(doctorId, (totals.get(doctorId) ?? 0) + value);
  return [...totals].map(([doctorId, revenue]) => ({ doctorId, revenue })).sort((a, b) => b.revenue - a.revenue);
};

export const payerMix = (metrics: DailyMetric[], days: RangeDays) => {
  const rows = metrics.slice(-days);
  return { insured: sum(rows.map((r) => r.insured)), selfPay: sum(rows.map((r) => r.selfPay)) };
};
```

- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** — `feat(clinic): dashboard metric maths — range figures, trends, series, revenue by doctor, payer mix`

---

### Task 2: Operations dashboard page

**Files:**
- Create: `src/pages/clinic/dashboard/OperationsDashboard.tsx`, `src/pages/clinic/shared/status.ts`
- Modify: `src/routes/router.tsx` (`/dashboard` renders the lazily loaded `OperationsDashboard`)
- Delete: `src/pages/dashboard/*` and `src/locales/{en,ar}/dashboard.json`, after the grep shows no other user
- Locales: `clinic.dashboard.*` (en/ar)
- Test: `src/pages/clinic/dashboard/OperationsDashboard.test.tsx`

**Interfaces:**
- Consumes: `useMetrics(90)`, `useDoctors()`, `usePatients()`, `useVisits({ from: today, to: today })`, plus `summarize`, `visitsSeries`, `revenueByDoctor` and `payerMix` from Task 1.
- Produces:
  - `status.ts` with `VISIT_TONE: Record<VisitStatus, Tone>` and `INVOICE_TONE: Record<InvoiceStatus, Tone>`. The visit tones are scheduled info, arrived accent, completed success, no-show warning, cancelled neutral. The invoice tones are draft neutral, sent info, overdue danger, paid success, void neutral.
  - `useClinicToday()` returns `{ todayKey: string; now: Date }` from `useDate().toDate()` and `new Date()`. It lives in `shared/useClinicToday.ts`. Tests set the store clock, and pages show the real date.

Page layout:
- **Header:** `PageHeader` with title "Operations" and the description "How the clinic is doing". Its action is a `Select` (size `sm`, labelled "Range") with Last 7 days, Last 30 days and Last 90 days, synced to the URL as `?range=7|30|90` (default 30) through nuqs `useQueryState('range', parseAsInteger.withDefault(30))`. Invalid values fall back to 30.
- **Stat cards:** `StatCard` ×4 in a `grid gap-4 sm:grid-cols-2 xl:grid-cols-4`:

| Card | Value | Trend | Sparkline | Link |
|---|---|---|---|---|
| Visits | number | visits trend | visits series | `/schedule?view=agenda` |
| New patients | number | trend | series | `/patients?sort=created` |
| No-show rate | percent, 1 decimal, via `useNumberFormat` | `positive: 'down'` | series (`tone` warning) | `/schedule?view=agenda` |
| Revenue | `<Money compact>` | trend | series | `/billing` |

  While loading, each card gets `loading`. A trend shows only when it isn't null. Sparklines get an `aria-label` such as "Visits per day".
- **Charts:** in a `grid gap-4 xl:grid-cols-3`, each inside a `Card` with a title:
  - **Visits per day:** `AreaChart` spanning 2 columns, `stacked`, with series completed (`chart-1`) and no-shows (`chart-4`). The x axis formats dates as `d MMM`.
  - **Payer mix:** `DonutChart` with insured and self-pay. Its center label is "Visits" and the center value is the total.
  - **Revenue by doctor:** `BarChart` in horizontal orientation with `valueFormat="money"`, doctor names localized.
  - **Today's visits:** a `Timeline` of today's `scheduled` and `arrived` visits sorted by start. Each item's title is the patient name (a `Link` to the profile), its meta is the doctor and time, and its tone comes from `VISIT_TONE`. With no visits it uses `empty` "No more visits today". With more than 6 visits it shows 6 plus a "View schedule" link.
- **Errors:** if metrics fail, a danger `Alert` with Retry replaces the cards and charts. If the visits query fails, the Timeline card shows its own small Alert with Retry.

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment happy-dom
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { clinicStore } from '@api/clinic';

import i18n from '../../../i18n';
import { renderClinic, resetClinic } from '../test-utils';
import OperationsDashboard from './OperationsDashboard';

beforeEach(() => {
  resetClinic();
  // recharts' ResponsiveContainer measures its parent; happy-dom has no layout.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(DOMRect.fromRect({ width: 600, height: 240 }));
});
afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  clinicStore.setClock(null);
  await act(() => i18n.changeLanguage('en'));
});

const renderPage = (route = '/dashboard') => renderClinic(<OperationsDashboard />, { route, path: '/dashboard' });

describe('OperationsDashboard', () => {
  it('shows four stat cards with values for the last 30 days by default', async () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Operations' })).toBeTruthy();
    const visits = await screen.findByRole('link', { name: /Visits/ });
    expect(visits.getAttribute('href')).toBe('/schedule?view=agenda');
    const total = clinicStore.read().metrics.slice(-30).reduce((sum, row) => sum + row.visits, 0);
    expect(visits.textContent).toContain(total.toLocaleString('en'));
    expect(screen.getByRole('link', { name: /New patients/ }).getAttribute('href')).toBe('/patients?sort=created');
    expect(screen.getByRole('link', { name: /Revenue/ }).getAttribute('href')).toBe('/billing');
  });

  it('switches the range and hides trends without a previous range', async () => {
    renderPage('/dashboard?range=90');
    const visits = await screen.findByRole('link', { name: /Visits/ });
    const total = clinicStore.read().metrics.reduce((sum, row) => sum + row.visits, 0);
    expect(visits.textContent).toContain(total.toLocaleString('en'));
    expect(visits.querySelector('[data-slot="stat-card-trend"]')).toBeNull();
  });

  it("lists today's upcoming visits with links to the patients", async () => {
    renderPage();
    const today = await screen.findByRole('region', { name: "Today's visits" });
    const upcoming = clinicStore.read().visits.filter((v) => v.start.startsWith('2026-10-16') && (v.status === 'scheduled' || v.status === 'arrived'));
    await waitFor(() => expect(within(today).getAllByRole('link').length).toBeGreaterThanOrEqual(Math.min(upcoming.length, 6)));
  });

  it('shows an error with Retry when metrics fail, and recovers', async () => {
    clinicStore.failNext('listMetrics');
    renderPage();
    const alert = await screen.findByRole('alert');
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('link', { name: /Visits/ })).toBeTruthy();
  });

  it('renders in Arabic with Western digits', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderPage();
    expect(await screen.findByRole('heading', { level: 1, name: 'العمليات' })).toBeTruthy();
    await screen.findAllByRole('link');
    expect(document.body.textContent).not.toMatch(/[٠-٩]/);
  });
});
```

(Adjust the assertions only if a kit component labels things differently. For example, check how `StatCard` names its link; if its accessible name differs, use its `data-slot`.)

- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** the page, `status.ts`, `useClinicToday`, the router swap, the old-page removal and the locales:
  - en: "Operations", "How the clinic is doing", "Range", "Last 7 days", "Last 30 days", "Last 90 days", "Visits", "New patients", "No-show rate", "Revenue", "Visits per day", "Payer mix", "Insured", "Self-pay", "Revenue by doctor", "Today's visits", "No more visits today", "View schedule", "Completed", "No-shows", and the error title "The dashboard couldn't be loaded"
  - ar: "العمليات", "كيف تسير العيادة", "الفترة", "آخر 7 أيام", "آخر 30 يومًا", "آخر 90 يومًا", "الزيارات", "مرضى جدد", "نسبة عدم الحضور", "الإيرادات", "الزيارات يوميًا", "توزيع الدافعين", "مؤمَّن", "دفع ذاتي", "الإيرادات حسب الطبيب", "زيارات اليوم", "لا زيارات أخرى اليوم", "عرض الجدول", "مكتملة", "لم يحضروا", "تعذّر تحميل لوحة التحكم"
- [ ] **Step 4: Run** the page test and the whole `src/pages` + `src/routes` + `src/layouts` suites. Expected: PASS.
- [ ] **Step 5: Commit** — `feat(clinic): operations dashboard replaces the placeholder dashboard`

---

### Task 3: Patients — Registered column and `?sort=created`

**Files:** Modify `PatientsPage.tsx` and its test. Add `clinic.patients.columns.registered` ("Registered" / "تاريخ التسجيل").

- [ ] **Step 1: Write the failing test** (append):

```tsx
it('sorts newest registrations first with ?sort=created', async () => {
  renderClinic(<PatientsPage />, { route: '/patients?sort=created', path: '/patients' });
  const newest = [...clinicStore.read().patients].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  await screen.findByText(newest.name.en);
  expect(screen.getAllByRole('row')[1].textContent).toContain(newest.name.en);
});
```

- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement.**
  - **Column:** a `createdAt` column with `accessorFn` `createdAt.slice(0, 10)`, sortable and `sortDescFirst`. The cell shows the date in `<bdi>`.
  - **Initial sort:** `useSearchParams().get('sort') === 'created'` makes the initial sorting `[{ id: 'createdAt', desc: true }]`; otherwise it stays by name.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** — `feat(clinic): Patients Registered column and newest-first ?sort=created`

---

### Task 4: Billing maths and CSV

**Files:**
- Create: `src/pages/clinic/billing/billing.ts`
- Test: `src/pages/clinic/billing/billing.test.ts`

**Interfaces:**
- Produces:
  - `type InvoiceRow = Invoice & { patientName: string; total: number; balance: number }`
  - `toInvoiceRows(invoices, patients, localize): InvoiceRow[]`
  - `billingSummary(invoices, todayKey): { outstanding: number; overdue: number; overdueCount: number; collectedThisMonth: number }`
  - `invoicesToCsv(rows: InvoiceRow[], headers: Record<'number' | 'patient' | 'issued' | 'due' | 'status' | 'total' | 'balance', string>, statusLabel: (s: InvoiceStatus) => string): string`
  - `downloadCsv(filename, csv)` (Blob plus an anchor click; not unit-tested)

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vite-plus/test';

import type { Invoice } from '@api/clinic';

import { billingSummary, invoicesToCsv, type InvoiceRow } from './billing';

const invoice = (overrides: Partial<Invoice>): Invoice => ({
  id: 'inv-1',
  number: 'INV-2026-0001',
  patientId: 'pt-1',
  visitId: null,
  issuedAt: '2026-10-01',
  dueAt: '2026-10-15',
  status: 'sent',
  lines: [{ id: 'l1', service: 'consultation', quantity: 1, unitPrice: 40 }],
  payments: [],
  ...overrides,
});

describe('billing summary', () => {
  it('sums outstanding and overdue balances and this month’s payments', () => {
    const summary = billingSummary(
      [
        invoice({ id: 'a', status: 'sent' }),
        invoice({ id: 'b', status: 'overdue', payments: [{ id: 'p', amount: 10, method: 'cash', date: '2026-10-05' }] }),
        invoice({ id: 'c', status: 'paid', payments: [{ id: 'q', amount: 40, method: 'card', date: '2026-09-30' }] }),
        invoice({ id: 'd', status: 'void' }),
        invoice({ id: 'e', status: 'draft' }),
      ],
      '2026-10-16',
    );
    expect(summary).toEqual({ outstanding: 70, overdue: 30, overdueCount: 1, collectedThisMonth: 10 });
  });
});

describe('invoices CSV', () => {
  it('quotes and escapes fields, keeps Arabic, and starts with a BOM', () => {
    const rows = [
      { ...invoice({}), patientName: 'سارة "Sara", حداد', total: 40, balance: 40 },
    ] as InvoiceRow[];
    const csv = invoicesToCsv(
      rows,
      { number: 'Number', patient: 'Patient', issued: 'Issued', due: 'Due', status: 'Status', total: 'Total', balance: 'Balance' },
      (status) => status.toUpperCase(),
    );
    expect(csv.startsWith('﻿')).toBe(true);
    const [header, line] = csv.slice(1).split('\r\n');
    expect(header).toBe('"Number","Patient","Issued","Due","Status","Total","Balance"');
    expect(line).toBe('"INV-2026-0001","سارة ""Sara"", حداد","2026-10-01","2026-10-15","SENT","40.00","40.00"');
  });
});
```

- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement**

```ts
import { type Invoice, invoiceBalance, type InvoiceStatus, invoiceTotal, type Localized, type Patient } from '@api/clinic';

export type InvoiceRow = Invoice & { patientName: string; total: number; balance: number };

export const toInvoiceRows = (invoices: Invoice[], patients: Pick<Patient, 'id' | 'name'>[], localize: (value: Localized | undefined) => string): InvoiceRow[] => {
  const names = new Map(patients.map((patient) => [patient.id, patient.name]));
  return invoices.map((invoice) => ({ ...invoice, patientName: localize(names.get(invoice.patientId)), total: invoiceTotal(invoice), balance: invoiceBalance(invoice) }));
};

const cents = (value: number) => Math.round(value * 100) / 100;

export const billingSummary = (invoices: Invoice[], todayKey: string) => {
  const open = invoices.filter((invoice) => invoice.status === 'sent' || invoice.status === 'overdue');
  const overdue = open.filter((invoice) => invoice.status === 'overdue');
  const month = todayKey.slice(0, 7);
  return {
    outstanding: cents(open.reduce((sum, invoice) => sum + invoiceBalance(invoice), 0)),
    overdue: cents(overdue.reduce((sum, invoice) => sum + invoiceBalance(invoice), 0)),
    overdueCount: overdue.length,
    collectedThisMonth: cents(
      invoices.flatMap((invoice) => invoice.payments).filter((payment) => payment.date.startsWith(month)).reduce((sum, payment) => sum + payment.amount, 0),
    ),
  };
};

const field = (value: string) => `"${value.replaceAll('"', '""')}"`;

/** CSV for spreadsheets: every field quoted, CRLF lines, and a BOM so Excel reads UTF-8 (Arabic names) correctly. */
export const invoicesToCsv = (
  rows: InvoiceRow[],
  headers: Record<'number' | 'patient' | 'issued' | 'due' | 'status' | 'total' | 'balance', string>,
  statusLabel: (status: InvoiceStatus) => string,
) => {
  const lines = [
    [headers.number, headers.patient, headers.issued, headers.due, headers.status, headers.total, headers.balance],
    ...rows.map((row) => [row.number, row.patientName, row.issuedAt, row.dueAt, statusLabel(row.status), row.total.toFixed(2), row.balance.toFixed(2)]),
  ];
  return `﻿${lines.map((cells) => cells.map(field).join(',')).join('\r\n')}`;
};

export const downloadCsv = (filename: string, csv: string) => {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = Object.assign(document.createElement('a'), { href: url, download: filename });
  anchor.click();
  URL.revokeObjectURL(url);
};
```

- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** — `feat(clinic): billing summary, invoice rows and CSV export`

---

### Task 5: Billing page

**Files:**
- Create: `src/pages/clinic/billing/BillingPage.tsx`
- Modify: routes (`FULL_ROUTES_PATH.BILLING = { INDEX: '/billing' }`, menu `billing` with the lucide `Receipt` icon after Patients, lazy route), `nav.json` (`billing`: "Billing" / "الفواتير"), `clinic.json` (`billing.*`)
- Test: `src/pages/clinic/billing/BillingPage.test.tsx`

Page:
- **Header:** `PageHeader` "Billing" with the description "Invoices, payments and what is still owed."
- **Summary:** `StatCard` ×3:
  - Outstanding (Money)
  - Overdue (Money, with the caption "{{count}} invoices")
  - Collected this month (Money)
- **Status tabs:** `Tabs` with All, Draft, Sent, Overdue, Paid and Void, each showing a count, synced as `?status=` through nuqs. The active tab sets a `status` column filter, and "All" clears it.
- **Table:** a `DataTable` with:
  - `createSelectionColumn({ getRowLabel: (row) => row.number })`
  - Number (LTR) and Patient (a `Link` to `patientPath`)
  - Issued and Due (dates in `<bdi>`)
  - Status (a `Badge` toned by `INVOICE_TONE`)
  - Total and Balance (`Money`, numeric)
  - global search over number and patient name only
  - sorting by issued date, newest first
  - `onRowClick` opens the `InvoiceSheet` (Task 6), with the id held in `?invoice=`
  - `rowSelection` state with `getRowId: (row) => row.id`
- **Bulk actions** (`DataTable.BulkActions`):
  - **Send reminders:** calls `bulk.mutate({ ids, action: 'send-reminder' })`, then a toast "Reminders sent to {{done}}", plus ", {{skipped}} skipped" when any were skipped.
  - **Mark paid:** opens a `ConfirmDialog` ("Mark {{count}} invoices paid?", with the description "Their outstanding balance is recorded as a card payment today."). On confirm, `action: 'mark-paid'` runs, then a toast "{{done}} marked paid", plus ", {{skipped}} skipped (not open)" when any were skipped. The selection clears afterwards.
  - **Export CSV:** calls `downloadCsv(`invoices-${todayKey}.csv`, invoicesToCsv(selectedRows, …))`.
- **States:** loading through `isLoading`. An error (invoices or patients) shows an Alert with Retry. An empty filtered table shows the DataTable empty state; zero invoices overall shows `EmptyState` "No invoices yet".

- [ ] **Step 1: Write the failing tests**

```tsx
// @vitest-environment happy-dom
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { clinicStore, invoiceBalance } from '@api/clinic';
import { Toaster } from '@components/shared';

import i18n from '../../../i18n';
import { renderClinic, resetClinic } from '../test-utils';
import BillingPage from './BillingPage';

beforeEach(resetClinic);
afterEach(async () => {
  cleanup();
  clinicStore.setClock(null);
  await act(() => i18n.changeLanguage('en'));
});

const renderPage = (route = '/billing') =>
  renderClinic(
    <>
      <BillingPage />
      <Toaster />
    </>,
    { route, path: '/billing' },
  );

describe('BillingPage', () => {
  it('summarises what is owed and lists invoices', async () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Billing' })).toBeTruthy();
    const newest = [...clinicStore.read().invoices].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt) || b.id.localeCompare(a.id))[0];
    expect(await screen.findByText(newest.number)).toBeTruthy();
    expect(screen.getByText('Outstanding')).toBeTruthy();
  });

  it('filters by status tab and keeps it in the URL', async () => {
    renderPage();
    await screen.findAllByRole('row');
    fireEvent.mouseDown(screen.getByRole('tab', { name: /Overdue/ }));
    fireEvent.click(screen.getByRole('tab', { name: /Overdue/ }));
    await waitFor(() => {
      const badges = [...document.querySelectorAll('tbody [data-slot="badge"]')].map((badge) => badge.textContent);
      expect(badges.length).toBeGreaterThan(0);
      expect(badges.every((text) => text === 'Overdue')).toBe(true);
    });
  });

  it('marks a mixed selection paid after confirming, reporting skipped invoices', async () => {
    const { invoices } = clinicStore.read();
    const open = invoices.find((i) => i.status === 'sent' || i.status === 'overdue')!;
    const paid = invoices.find((i) => i.status === 'paid')!;
    renderPage();
    await screen.findByText(open.number);
    // Select both rows by searching each number, ticking the row checkbox.
    const search = screen.getByPlaceholderText('Search by number or patient');
    for (const number of [open.number, paid.number]) {
      fireEvent.change(search, { target: { value: number } });
      await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(2));
      fireEvent.click(within(screen.getAllByRole('row')[1]).getByRole('checkbox'));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Mark paid' }));
    fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Mark paid' }));
    expect(await screen.findByText('1 marked paid, 1 skipped (not open)')).toBeTruthy();
    expect(invoiceBalance(clinicStore.read().invoices.find((i) => i.id === open.id)!)).toBe(0);
  });

  it('shows an error with Retry, and recovers', async () => {
    clinicStore.failNext('listInvoices');
    renderPage();
    fireEvent.click(within(await screen.findByRole('alert')).getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Outstanding')).toBeTruthy();
  });

  it('renders in Arabic', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderPage();
    expect(await screen.findByRole('heading', { level: 1, name: 'الفواتير' })).toBeTruthy();
    await screen.findByText(clinicStore.read().invoices[0].number);
    expect(document.body.textContent).not.toMatch(/[٠-٩]/);
  });
});
```

(If the ConfirmDialog renders with role `dialog` rather than `alertdialog`, match what the kit uses. The Overdue tab click needs `mouseDown` because Radix Tabs activate on it.)

- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** the page, routes, menu and locales.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** — `feat(clinic): Billing page — summary, status tabs, invoice table, bulk reminders, mark paid and CSV`

---

### Task 6: Invoice Sheet

**Files:**
- Create: `src/pages/clinic/billing/InvoiceSheet.tsx`
- Modify: `BillingPage.tsx` (render the Sheet for `?invoice=`)
- Test: `src/pages/clinic/billing/InvoiceSheet.test.tsx`

Sheet (`Sheet.Content`, side `end`, size `md`):
- **Title and description:** the title is the invoice number. The description is the patient name, "Issued {{date}} · Due {{date}}" and a status Badge.
- **Lines:** a table of service (localized service name), quantity, unit price and amount, followed by a total row.
- **Payments:** a list of date, method and amount, or "No payments yet". Then a "Balance" row in Money.
- **Record payment** (only for `sent` or `overdue` invoices): a `FormContainer` with react-hook-form and zod:
  - `amount` through `FormNumber`, required, `> 0` and `<= balance`. The errors read "Enter an amount above 0" and "Can't be more than the balance ({{balance}})".
  - `method` through `FormSelect` with cash, card and insurance; the default is card.
  - `date` through `FormDatePicker` (or `FormInput type="date"` if the picker's value contract is awkward), defaulting to today.
  - **Submit:** "Record payment", with loading while saving. On success: a toast "Payment recorded", a form reset, and a refresh through invalidation. On a `ClinicError`: a toast with the error code mapped to copy.
- **Footer actions:**
  - **Send invoice:** for drafts, through `useSendInvoice`.
  - **Void invoice:** for anything but paid, through a ConfirmDialog ("Void {{number}}?" / "A voided invoice can't be paid or sent.").
  - **Close.**
- **States:** loading shows a Skeleton; an unknown id shows an EmptyState "Invoice not found".
- **URL:** closing the Sheet removes `?invoice=`.

- [ ] **Step 1: Write the failing tests**

```tsx
// @vitest-environment happy-dom
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { clinicStore, invoiceBalance } from '@api/clinic';
import { Toaster } from '@components/shared';

import { renderClinic, resetClinic } from '../test-utils';
import BillingPage from './BillingPage';

import '../../../i18n';

beforeEach(resetClinic);
afterEach(() => {
  cleanup();
  clinicStore.setClock(null);
});

const openInvoice = () => clinicStore.read().invoices.find((i) => (i.status === 'sent' || i.status === 'overdue') && i.payments.length === 0)!;

const renderWith = (id: string) =>
  renderClinic(
    <>
      <BillingPage />
      <Toaster />
    </>,
    { route: `/billing?invoice=${id}`, path: '/billing' },
  );

describe('InvoiceSheet', () => {
  it('shows lines, payments and the balance', async () => {
    const invoice = openInvoice();
    renderWith(invoice.id);
    const sheet = await screen.findByRole('dialog', { name: invoice.number });
    expect(within(sheet).getByText('No payments yet')).toBeTruthy();
    expect(within(sheet).getByText('Balance')).toBeTruthy();
  });

  it('refuses an amount over the balance or of 0 without saving', async () => {
    const invoice = openInvoice();
    renderWith(invoice.id);
    const sheet = await screen.findByRole('dialog', { name: invoice.number });
    const amount = within(sheet).getByLabelText('Amount');
    fireEvent.change(amount, { target: { value: String(invoiceBalance(invoice) + 1) } });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Record payment' }));
    expect(await within(sheet).findByText(/Can't be more than the balance/)).toBeTruthy();
    fireEvent.change(amount, { target: { value: '0' } });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Record payment' }));
    expect(await within(sheet).findByText('Enter an amount above 0')).toBeTruthy();
    expect(clinicStore.read().invoices.find((i) => i.id === invoice.id)!.payments).toHaveLength(0);
  });

  it('records the full balance and the invoice becomes paid', async () => {
    const invoice = openInvoice();
    renderWith(invoice.id);
    const sheet = await screen.findByRole('dialog', { name: invoice.number });
    fireEvent.change(within(sheet).getByLabelText('Amount'), { target: { value: String(invoiceBalance(invoice)) } });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Record payment' }));
    expect(await screen.findByText('Payment recorded')).toBeTruthy();
    await waitFor(() => expect(clinicStore.read().invoices.find((i) => i.id === invoice.id)!.status).toBe('paid'));
  });

  it('voids an open invoice after confirming', async () => {
    const invoice = openInvoice();
    renderWith(invoice.id);
    const sheet = await screen.findByRole('dialog', { name: invoice.number });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Void invoice' }));
    fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Void invoice' }));
    await waitFor(() => expect(clinicStore.read().invoices.find((i) => i.id === invoice.id)!.status).toBe('void'));
  });

  it('shows "not found" for an unknown invoice', async () => {
    renderWith('inv-nope');
    expect(await screen.findByText('Invoice not found')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** the Sheet and wire it into the page. Copy is in `clinic.billing.sheet.*` (en/ar), including service names (`services.consultation` …) and payment methods (`methods.cash` …).
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** — `feat(clinic): invoice Sheet — lines, payments, record payment, send and void`

---

### Task 7: Exit — gate and browser check

- [ ] **Step 1:** Run the full gate: `P ds:baseline && P exec vp fmt && P exec vp check && P exec tsc -b && P exec tsc -p tsconfig.scripts.json && P docs:lint && P exec vp test --run src tests && P exec vp build`. Then grep `dist/assets` for `frontmatter` and `DocsLayout` → 0. recharts is now expected.
- [ ] **Step 2: Browser check** of `/dashboard` and `/billing`:
  - at 1440 px in light and dark
  - at 390 px
  - in Arabic, at 1440 px
  - on Billing:
    - select 3 invoices and mark them paid (the toast reports the counts)
    - export a CSV (the download event fires)
    - open the Sheet and record a payment

  Fix findings under TDD.
- [ ] **Step 3: Commit** — `test(clinic): Plan B exit — gate and browser check`
