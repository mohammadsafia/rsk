# Clinic example pages — Plan C: Schedule and Patient profile — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two pages:
- **`/schedule`:** a CalendarGrid scheduler over the clinic's doctors, visits, availability and leave days. You create visits from slots, move and resize them with saving, and set a visit's status from its popover.
- **`/patients/:id`:** a patient profile with a header, figures, and Overview, Timeline and Invoices tabs, plus an edit Sheet.

**Architecture:**
- **Backend additions:** `clinicService` gains `listPatientVisits(patientId)` and `updatePatient(id, patch)`, each with a handler and a hook.
- **Schedule:** adapts clinic data to `CalendarGrid`. The pure mapping lives in `schedule/adapters.ts`: visit and leave events, resources and slots.
- **Grid state:** the view and date are controlled by nuqs (`?view=`, `?date=`). The visible range comes from `onRangeChange` and feeds `useVisits`/`useLeave`.
- **Create Sheet:** opened by `onSlotSelect`. `?patient=<id>` preselects the patient.
- **Profile:** composes PageHeader (with `media` and `meta`), StatCards, Tabs (`?tab=`), Timeline with `useGroupedByDay`, and the invoice list linking to `/billing?invoice=`.

**Tech Stack:** React 18, react-query 4, nuqs, react-hook-form + zod, `@components/calendar` (Plan D of kit depth), react-i18next, Vitest + Testing Library (happy-dom).

**Spec:** `docs/superpowers/specs/2026-10-16-example-pages-design.md` (Schedule, Patient profile).

## Global Constraints

- Semantic tokens only; `ds:baseline` stays `{}`. No coloured side stripes. Every field keeps Input's height.
- English and Arabic for all copy, in `clinic.json`, with full Arabic plural forms (`_zero/_one/_two/_few/_many/_other`). RTL-correct, with LTR-isolated values, Western digits, and dates in `<bdi>` without `tabular-nums`.
- Every query renders four states: skeleton, empty, error (Alert with Retry) and data. Mutations show loading on the button that triggered them, and a toast when they finish.
- Stable references in anything handed to tables, grids or hook deps: memoise derived arrays, and use module constants for empty arrays.
- Responsive down to 390 px. Production code never imports `@component-docs/*`. No new dependencies.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Page tests use `renderClinic` and `resetClinic` (clock fixed at Fri 16 Oct 2026 09:00, latency 0).

## Rulings (decided here)

- **Leave days** are all-day events in the grid (`isAllDay`), with the reason as the label. They are not editable and have no popover actions.
- **Editable visits:** `canEdit` allows only `scheduled` and `arrived` visits whose end is after now. Everything else is locked.
- **Popover actions** follow the store's statuses: "Mark arrived" (scheduled), "Mark no-show" (scheduled), "Complete" (arrived). Plan A deferred the transition checks, so the UI offers only these.
- **Failed moves:** a failed move gets CalendarGrid's own revert toast. The page adds no second toast.
- **Profile timeline:** the patient's visits (store-wide, from `listPatientVisits`) and the payments on their invoices, newest day first. The spec mentions notes, but the store has no notes entity, so a visit's `notes` shows as the item meta.
- **Edit Sheet scope:** phone, email, insurer and policy number. A duplicate phone is a field error.
- **Book visit** links to `/schedule?patient=<id>&view=week`. The next slot picked opens the create Sheet with that patient preselected.

## Review Focus

1. **A move that double-books.** The store rejects it, CalendarGrid reverts the visit with its toast, and the schedule still shows the visit in its original slot after the refetch. → Task 3 test.
2. **`?patient=` naming an unknown patient.** The create Sheet opens without a preselection and never crashes. → Task 3 test.
3. **An unknown profile id.** The page shows an EmptyState with a link back to Patients, not an error loop. → Task 4 test.
4. **Duplicate phone on edit.** The Phone field shows the error and nothing saves. → Task 5 test.
5. **A leave day in resource-keyed slots.** That doctor's day is unavailable, so selection is refused. → Task 2 test (adapter unit test).

---

### Task 1: Backend — patient visits and patient updates

**Files:** `src/api/clinic/service.ts` (+ test), `handlers/{patients,visits}.ts`, `src/pages/clinic/queries.ts`.

**Interfaces:**
- `clinicService.listPatientVisits(patientId): Visit[]` returns the patient's visits newest first, and throws `not-found` for an unknown patient. `ClinicOp` gains `'listPatientVisits' | 'updatePatient'`.
- `clinicService.updatePatient(id, patch: Partial<Pick<Patient, 'phone' | 'email' | 'insurerId' | 'policyNumber'>>): Patient` throws `duplicate-phone` (with `fieldErrors: { phone: 'duplicate-phone' }`) when another patient has the phone.
- `VisitsHandler.byPatient = { queryKey: 'clinic/visits/by-patient', request }`, `PatientsHandler.update = { request }`.
- `usePatientVisits(id)`, `useUpdatePatient()` (mutation `{ id, patch }`).

- [ ] **Step 1: Write the failing tests** (append to `service.test.ts`):

```ts
describe('clinicService patient visits and updates', () => {
  it('lists one patient’s visits newest first', async () => {
    const patientId = clinicStore.read().visits[0].patientId;
    const visits = await clinicService.listPatientVisits(patientId);
    expect(visits.length).toBeGreaterThan(0);
    expect(visits.every((v) => v.patientId === patientId)).toBe(true);
    expect(visits.map((v) => v.start)).toEqual([...visits.map((v) => v.start)].sort().reverse());
    await expect(clinicService.listPatientVisits('nope')).rejects.toMatchObject({ code: 'not-found' });
  });

  it('updates contact details and refuses another patient’s phone', async () => {
    const [a, b] = clinicStore.read().patients;
    const updated = await clinicService.updatePatient(a.id, { email: 'new@example.com', phone: '+962 79 000 0009' });
    expect(updated).toMatchObject({ email: 'new@example.com', phone: '+962 79 000 0009' });
    await expect(clinicService.updatePatient(a.id, { phone: b.phone })).rejects.toMatchObject({ code: 'duplicate-phone', fieldErrors: { phone: 'duplicate-phone' } });
    // Keeping your own phone is not a duplicate.
    await expect(clinicService.updatePatient(a.id, { phone: '+962 79 000 0009' })).resolves.toBeTruthy();
  });
});
```

- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** the ops, handlers and hooks.
- [ ] **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** — `feat(clinic): patient visit history and contact updates in the clinic backend`

---

### Task 2: Schedule adapters

**Files:** `src/pages/clinic/schedule/adapters.ts` (+ `adapters.test.ts`).

**Interfaces:**
- `type ScheduleEvent = { kind: 'visit'; visit: Visit } | { kind: 'leave'; leave: LeaveDay }`, with `id`, `start`, `end` and `doctorId` lifted to the top level for the accessors.
- `toScheduleEvents(visits, leave): ScheduleEvent[]`
  - cancelled visits are dropped
  - leave starts at 00:00 and ends at the next 00:00 local
- `scheduleAccessors: CalendarAccessors<ScheduleEvent>` with `getResourceId → doctorId` and `isAllDay → kind === 'leave'`.
- `toResources(doctors, localize): CalendarResource[]`
- `toSlots(doctors, leave, range): Record<doctorId, Record<dayKey, TimeRange[]>>`
  - working days get 08:00–12:00 and 13:00–17:00
  - Fridays get 08:00–12:00
  - leave days get `[]`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS. **Step 5: Commit** — `feat(clinic): schedule adapters — events, resources and availability`

---

### Task 3: Schedule page

**Files:** `src/pages/clinic/schedule/SchedulePage.tsx`, `src/pages/clinic/schedule/NewVisitSheet.tsx` (+ tests); routes (`FULL_ROUTES_PATH.SCHEDULE.INDEX = '/schedule'`, a menu `schedule` entry with the lucide `CalendarDays` icon placed after Dashboard, and a lazy route); `nav.json` (`schedule`: "Schedule" / "الجدول"); `clinic.json` (`schedule.*`).

Page:
- **Header:** `PageHeader` "Schedule" with the description "Visits by doctor".
- **Grid:** `CalendarGrid`, with these props:
  - `view` and `date` controlled by `useQueryState('view', parseAsStringLiteral(['day','week','month','agenda']).withDefault('day'))` and `useQueryState('date', parseAsIsoDate)`. If the param name is unusual, plain `parseAsString` is enough, defaulting to `todayKey`.
  - `events` from `toScheduleEvents(visits, leave)`, with `eventAccessors={scheduleAccessors}`, `resources` and `slots`.
  - `startHour` 7, `endHour` 18, `stepMinutes` 15.
  - `onRangeChange` sets the range state that feeds `useVisits` and `useLeave`.
  - `onSlotSelect` opens `NewVisitSheet`.
  - `onEventChange={({ event, start, end, resourceId }) => updateVisit.mutateAsync({ id: event.id, patch: { start, end, doctorId: resourceId ?? event.doctorId } })}`
  - `canEdit` follows the ruling.
- **Chrome:** `CalendarGrid.Header` holds Navigation, ResourceFilter, `ViewTabs views={['day','week','month','agenda']}` and Picker.
- **EventTemplate:**
  - **Visits:** a block with the patient name and the localized visit type, coloured by status through semantic tokens: scheduled `bg-info-subtle`, arrived `bg-accent-subtle`, completed `bg-success-subtle`, no-show `bg-warning-subtle`. If a token is missing, use the closest one that exists.
  - **Leave:** a neutral chip reading "On leave" or "Conference".
- **PopoverTemplate (visits only):**
  - the patient (a link to the profile), time, doctor and a status Badge
  - the allowed status actions through `useSetVisitStatus`, each with loading and a toast
  - "Open profile"
- **States:** while loading with no data, `isLoading`. If visits, leave or doctors fail, a danger Alert with Retry above the grid.

`NewVisitSheet` (`Sheet.Content` titled "New visit"):
- **Description:** the slot's day, time range and doctor.
- **Form fields:**
  - a patient `FormCombobox`, required, with localized names
  - a type `FormSelect` with the four types, defaulting to consultation
  - a notes `FormTextarea`
- **Submit:** "Book visit", through `useCreateVisit.mutateAsync({ patientId, doctorId, type, start, end, notes })`. Success shows a toast "Visit booked" and closes the Sheet. A `ClinicError` `conflict` shows the toast "That time is no longer free" and keeps the Sheet open.
- **Preselection:** `?patient=<id>` preselects the patient when that id exists.

- [ ] **Step 1: Write the failing tests** (`SchedulePage.test.tsx`; the layout stub comes from `@components/calendar` test-utils if exported, otherwise copy the 6-line `stubLayout` into the test):

```tsx
// @vitest-environment happy-dom
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { clinicStore } from '@api/clinic';
import { Toaster } from '@components/shared';

import i18n from '../../../i18n';
import { renderClinic, resetClinic } from '../test-utils';
import SchedulePage from './SchedulePage';

beforeEach(() => {
  resetClinic();
  // Columns 200px wide from x=100, 1100px tall (07:00–18:00 = 0.6 min/px), scroller 0..1100.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const index = Number(this.dataset.columnIndex ?? -1);
    if (this.dataset.calendarColumn !== undefined) return DOMRect.fromRect({ x: 100 + index * 200, y: 0, width: 200, height: 1100 });
    if (this.dataset.slot === 'calendar-grid-body') return DOMRect.fromRect({ x: 0, y: 0, width: 1600, height: 1100 });
    return DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 });
  });
});
afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  clinicStore.setClock(null);
  await act(() => i18n.changeLanguage('en'));
});

const renderPage = (route = '/schedule') =>
  renderClinic(
    <>
      <SchedulePage />
      <Toaster />
    </>,
    { route, path: '/schedule' },
  );
const at = (column: number, minute: number) => ({ clientX: 150 + column * 200, clientY: (minute - 7 * 60) / 0.6 });

describe('SchedulePage', () => {
  it("shows today's visits in one column per doctor", async () => {
    renderPage();
    const { visits, doctors } = clinicStore.read();
    const today = visits.find((v) => v.start.startsWith('2026-10-16') && v.status !== 'cancelled')!;
    const patient = clinicStore.read().patients.find((p) => p.id === today.patientId)!;
    await waitFor(() => expect(document.querySelectorAll('[data-calendar-column]')).toHaveLength(doctors.length));
    const column = document.querySelector(`[data-calendar-column][data-resource="${today.doctorId}"]`) as HTMLElement;
    expect(await within(column).findByText(patient.name.en)).toBeTruthy();
  });

  it('follows ?view=agenda', async () => {
    renderPage('/schedule?view=agenda');
    expect(await screen.findByRole('tab', { name: 'Agenda', selected: true })).toBeTruthy();
  });

  it('books a visit from a free slot', async () => {
    renderPage('/schedule?date=2026-10-17');
    await waitFor(() => expect(document.querySelectorAll('[data-calendar-column]').length).toBeGreaterThan(0));
    const column = document.querySelector('[data-calendar-column]') as HTMLElement;
    // 16:30 on Saturday the 17th: inside the afternoon slot, after every seeded visit window ends? choose a free 15-min cell.
    const free = 16 * 60 + 45;
    fireEvent.pointerDown(column, { button: 0, pointerId: 1, ...at(0, free) });
    fireEvent.pointerUp(window, { pointerId: 1, ...at(0, free) });
    const sheet = await screen.findByRole('dialog', { name: 'New visit' });
    const patient = clinicStore.read().patients[0];
    fireEvent.change(within(sheet).getByRole('combobox', { name: /Patient/ }), { target: { value: patient.name.en } });
    fireEvent.click(await screen.findByRole('option', { name: patient.name.en }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Book visit' }));
    expect(await screen.findByText('Visit booked')).toBeTruthy();
    expect(clinicStore.read().visits.some((v) => v.patientId === patient.id && v.start.startsWith('2026-10-17T16:45'))).toBe(true);
  });

  it('preselects the patient from ?patient=, and ignores an unknown one', async () => {
    const patient = clinicStore.read().patients[3];
    renderPage(`/schedule?date=2026-10-17&patient=${patient.id}`);
    await waitFor(() => expect(document.querySelectorAll('[data-calendar-column]').length).toBeGreaterThan(0));
    const column = document.querySelector('[data-calendar-column]') as HTMLElement;
    fireEvent.pointerDown(column, { button: 0, pointerId: 1, ...at(0, 16 * 60 + 45) });
    fireEvent.pointerUp(window, { pointerId: 1, ...at(0, 16 * 60 + 45) });
    const sheet = await screen.findByRole('dialog', { name: 'New visit' });
    expect(within(sheet).getByText(patient.name.en)).toBeTruthy();
    cleanup();
    renderPage('/schedule?date=2026-10-17&patient=nope');
    await waitFor(() => expect(document.querySelectorAll('[data-calendar-column]').length).toBeGreaterThan(0));
    fireEvent.pointerDown(document.querySelector('[data-calendar-column]')!, { button: 0, pointerId: 1, ...at(0, 16 * 60 + 45) });
    fireEvent.pointerUp(window, { pointerId: 1, ...at(0, 16 * 60 + 45) });
    expect(await screen.findByRole('dialog', { name: 'New visit' })).toBeTruthy();
  });

  it('reverts a move that double-books and keeps the visit where it was', async () => {
    renderPage('/schedule?date=2026-10-17');
    const { visits } = clinicStore.read();
    const sameDoctor = visits.filter((v) => v.start.startsWith('2026-10-17') && v.status === 'scheduled');
    const moving = sameDoctor[0];
    const blocker = sameDoctor.find((v) => v.doctorId === moving.doctorId && v.id !== moving.id);
    if (!blocker) return; // the seed always has 2+ visits per doctor near today; guard keeps the test honest if not
    const card = await waitFor(() => document.querySelector(`[data-event-id="${moving.id}"]`) as HTMLElement);
    const minute = (iso: string) => new Date(iso).getHours() * 60 + new Date(iso).getMinutes();
    const columnIndex = Number(card.closest('[data-calendar-column]')!.getAttribute('data-column-index'));
    fireEvent.pointerDown(card, { button: 0, pointerId: 1, ...at(columnIndex, minute(moving.start) + 1) });
    fireEvent.pointerMove(window, { pointerId: 1, ...at(columnIndex, minute(blocker.start) + 1) });
    fireEvent.pointerUp(window, { pointerId: 1, ...at(columnIndex, minute(blocker.start) + 1) });
    expect(await screen.findByText("Couldn't save the change")).toBeTruthy();
    expect(clinicStore.read().visits.find((v) => v.id === moving.id)!.start).toBe(moving.start);
  });

  it('marks a visit arrived from its popover', async () => {
    renderPage();
    const visit = clinicStore.read().visits.find((v) => v.start.startsWith('2026-10-16') && v.status === 'scheduled')!;
    const card = await waitFor(() => document.querySelector(`[data-event-id="${visit.id}"]`) as HTMLElement);
    fireEvent.click(card);
    fireEvent.click(await screen.findByRole('button', { name: 'Mark arrived' }));
    await waitFor(() => expect(clinicStore.read().visits.find((v) => v.id === visit.id)!.status).toBe('arrived'));
  });

  it('shows an error with Retry, and recovers', async () => {
    clinicStore.failNext('listVisits');
    renderPage();
    fireEvent.click(within(await screen.findByRole('alert')).getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});
```

(The slot minute in the booking tests must be free for the first doctor on the 17th. If the seed puts a visit there, pick a minute from `toSlots` that no visit of `doctors[0]` covers. Compute it in the test from the store rather than hard-coding it.)

- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS. **Step 5: Commit** — `feat(clinic): Schedule page — doctors as resources, booking, moves with saving, visit status from the popover`

---

### Task 4: Patient profile page

**Files:** `src/pages/clinic/patient-profile/PatientProfilePage.tsx` (+ test); routes (`/patients/:id` lazy route); `clinic.json` (`profile.*`).

Page:
- **Header:** `PageHeader` with:
  - `back="/patients"`
  - `media`: an `Avatar` with an initials fallback
  - `title`: the localized name
  - `meta`: the MRN (LTR), age ("{{count}} years", with full Arabic plurals), the phone (`bdi` LTR) and an insurer `Badge` ("Self-pay" when the patient has no insurer)
  - actions: "Book visit" (a `Link` to `/schedule?patient=<id>&view=week`) and "Edit" (Task 5)
- **Stat cards:** `StatCard` ×3:
  - **Visits this year:** completed visits whose start falls in the current year
  - **Balance due:** Money
  - **Last visit:** a date, or "—"
- **Tabs** (`?tab=` through `parseAsStringLiteral(['overview','timeline','invoices'])`, default overview):
  - **Overview:** a `DescriptionList` of date of birth, sex, email, insurer, policy number and primary doctor, plus allergies as `Tag`s, or "No known allergies".
  - **Timeline:** `useGroupedByDay` over the patient's visits and the payments on their invoices:
    - a visit item's title is the localized visit type plus the doctor; its time is the start; its tone comes from `VISIT_TONE`; its meta is the status
    - a payment item reads "Payment received" with the amount and method
    - with no items: `empty` "Nothing yet"
  - **Invoices:** the patient's invoices as a list or table with number, issued date, status Badge and balance. Each row is a `Link` to `/billing?invoice=<id>`, and with none the list shows "No invoices".
- **Not found:** an unknown id (`ClinicError` `not-found`) shows `EmptyState kind="no-results"` "Patient not found" with a link back to Patients. Any other error shows an Alert with Retry.

- [ ] **Step 1: Write the failing tests**

```tsx
// @vitest-environment happy-dom
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { clinicStore, invoiceBalance } from '@api/clinic';

import i18n from '../../../i18n';
import { renderClinic, resetClinic } from '../test-utils';
import PatientProfilePage from './PatientProfilePage';

beforeEach(resetClinic);
afterEach(async () => {
  cleanup();
  clinicStore.setClock(null);
  await act(() => i18n.changeLanguage('en'));
});

const renderProfile = (id: string, search = '') => renderClinic(<PatientProfilePage />, { route: `/patients/${id}${search}`, path: '/patients/:id' });

/** A patient with visits and at least one open invoice. */
const richPatient = () => {
  const { patients, invoices, visits } = clinicStore.read();
  return patients.find((p) => visits.some((v) => v.patientId === p.id) && invoices.some((i) => i.patientId === p.id && invoiceBalance(i) > 0 && (i.status === 'sent' || i.status === 'overdue')))!;
};

describe('PatientProfilePage', () => {
  it('shows the header with MRN, phone and a Book visit link', async () => {
    const patient = richPatient();
    renderProfile(patient.id);
    expect(await screen.findByRole('heading', { level: 1, name: patient.name.en })).toBeTruthy();
    expect(screen.getByText(patient.mrn)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Book visit' }).getAttribute('href')).toBe(`/schedule?patient=${patient.id}&view=week`);
  });

  it('shows the balance due', async () => {
    const patient = richPatient();
    renderProfile(patient.id);
    const balance = await screen.findByText('Balance due');
    expect(balance.closest('[data-slot="stat-card"]')!.textContent).toMatch(/\$\d/);
  });

  it('lists visits and payments on the timeline tab', async () => {
    const patient = richPatient();
    renderProfile(patient.id, '?tab=timeline');
    const panel = await screen.findByRole('tabpanel');
    await waitFor(() => expect(panel.querySelectorAll('[data-slot="timeline-item"], li').length).toBeGreaterThan(0));
  });

  it('links invoices to billing', async () => {
    const patient = richPatient();
    renderProfile(patient.id, '?tab=invoices');
    const invoice = clinicStore.read().invoices.find((i) => i.patientId === patient.id)!;
    const link = await screen.findByRole('link', { name: new RegExp(invoice.number) });
    expect(link.getAttribute('href')).toBe(`/billing?invoice=${invoice.id}`);
  });

  it('shows "not found" with a way back for an unknown patient', async () => {
    renderProfile('pt-nope');
    expect(await screen.findByText('Patient not found')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to patients' }).getAttribute('href')).toBe('/patients');
  });

  it('renders in Arabic with the Arabic name', async () => {
    await act(() => i18n.changeLanguage('ar'));
    const patient = richPatient();
    renderProfile(patient.id);
    expect(await screen.findByRole('heading', { level: 1, name: patient.name.ar })).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/[٠-٩]/);
  });
});
```

- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS. **Step 5: Commit** — `feat(clinic): Patient profile — header, figures, overview, timeline and invoices`

---

### Task 5: Edit contact details Sheet

**Files:** `src/pages/clinic/patient-profile/EditPatientSheet.tsx` (+ tests appended to the profile test).

- **Opened by** the profile's "Edit" button: a Sheet titled "Edit contact details".
- **Form fields:**
  - Phone: `FormInput`, required, `dir="ltr"`
  - Email: `FormInput type="email"`, optional, valid format
  - Insurer: `FormSelect` with the insurers plus Self-pay
  - Policy number: `FormInput`, required only when an insurer is chosen
- **Save:** `useUpdatePatient.mutateAsync`. Success shows the toast "Contact details saved" and closes the Sheet. A `duplicate-phone` error is set on the phone field with `form.setError('phone', { message: t('errors.duplicate-phone') })`.

- [ ] **Step 1: Write the failing tests** (append):

```tsx
it('saves new contact details', async () => {
  const patient = richPatient();
  renderProfile(patient.id);
  fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
  const sheet = await screen.findByRole('dialog', { name: 'Edit contact details' });
  fireEvent.change(within(sheet).getByLabelText(/^Email/), { target: { value: 'updated@example.com' } });
  fireEvent.click(within(sheet).getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(clinicStore.read().patients.find((p) => p.id === patient.id)!.email).toBe('updated@example.com'));
});

it('shows a duplicate phone on the field and saves nothing', async () => {
  const [patient, other] = clinicStore.read().patients;
  renderProfile(patient.id);
  fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
  const sheet = await screen.findByRole('dialog', { name: 'Edit contact details' });
  fireEvent.change(within(sheet).getByLabelText(/^Phone/), { target: { value: other.phone } });
  fireEvent.click(within(sheet).getByRole('button', { name: 'Save' }));
  expect(await within(sheet).findByText('That phone number is already registered')).toBeTruthy();
  expect(clinicStore.read().patients.find((p) => p.id === patient.id)!.phone).toBe(patient.phone);
});
```

- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS. **Step 5: Commit** — `feat(clinic): edit a patient's contact details`

---

### Task 6: Exit — gate and browser check

- [ ] Run the full gate, as in Plan B. Then do a browser check:
  - `/schedule` at 1440 px in light and dark: drag-create a visit, move one, check that a double-booked move reverts with a toast, and mark a visit arrived.
  - `/schedule` at 390 px with touch.
  - `/patients/:id`: all three tabs, and the edit save.
  - Arabic on both pages.
  - The dashboard's "Visits" card leads to the agenda.
  - Patients → profile → Book visit → Schedule with the patient preselected.

  Fix findings under TDD. Commit `test(clinic): Plan C exit — gate and browser check`.
