# Clinic example pages — design

**Status:** approved in brainstorming (2026-10-16), pending written-spec review
**Branch:** `feat/ui-kit-composites`
**Follow-up:** 3 of 3. It builds the five business pages that `2026-10-16-kit-depth-design.md` was scoped for.

## Goal

Prove the kit on a real product: one connected clinic app whose pages use the kit's components on believable data, with loading, empty and error states and writes that persist for the session. Replacing the mock backend with a real API touches only the handlers.

## Decisions (from brainstorming)

- **Placement:** the pages are real app pages inside the existing app shell, shipped in production builds. They are not part of the dev-only docs.
- **Data:** mock handlers in the repo's `{ queryKey, request }` shape, consumed through react-query v4. No new dependency.
- **Connected:** shared patients, doctors, visits and invoices, with links between pages.
- **Existing pages:** `/dashboard` is replaced by the clinic operations dashboard. Members and Settings stay as they are.

## Global constraints

- Semantic tokens only; the forbidden-pattern baseline stays `{}`. No coloured side stripes. Every field keeps Input's height. Graphite Instrument look with the Oxblood accent.
- English and Arabic for all copy, in a new `clinic` namespace in `src/locales/{en,ar}`. RTL-correct, LTR-isolated values, Western digits. Money goes through `formatMoney`/`useMoneyFormat`, and dates through `useDate`.
- Every query renders four states: skeleton, empty (EmptyState with an action), error (Alert with Retry) and data. Mutations show loading on the button that triggered them and a toast when they finish.
- Responsive down to 390 px: tables scroll horizontally, and the dashboard and stat grids collapse to one column.
- Production code never imports `@component-docs/*`; the docs stay dev-only.
- No new dependencies. Kit components may get small additive fixes when a page exposes a gap. Each fix is test-first and recorded in its plan.

## Architecture

```
src/api/clinic/
  seed.ts         deterministic seed, generated relative to today
  store.ts        in-memory tables, sessionStorage persistence, simulated latency, invariants
  handlers/       PatientsHandler, VisitsHandler, InvoicesHandler, MetricsHandler, ClinicDoctorsHandler
src/pages/clinic/
  queries.ts      react-query hooks (usePatients, usePatient, useVisits(range), useCreateVisit,
                  useMoveVisit, useInvoices, useRecordPayment, useBulkInvoices, useMetrics(range),
                  useRegisterPatient) with cache invalidation
  dashboard/  schedule/  patients/  patient-profile/  billing/  intake/
```

- **Layering:** pages use only `queries.ts`, never the store directly. Handlers are the only layer a real API replaces, by swapping each `request` for an `httpClient` call.
- **Seed:**
  - 4 doctors; about 60 patients with Arabic and English name pairs, MRNs, insurers and allergies.
  - About 120 visits spread over ±3 weeks around today, with statuses scheduled, arrived, completed and no-show.
  - Doctor leave days, which render in the all-day row.
  - About 80 invoices with line items and payments; 90 days of daily metrics.
  - A fixed random seed, so tests and screenshots are stable.
- **Store:**
  - Simulated latency of 250–600 ms, set to 0 in tests.
  - Persists to sessionStorage until the tab closes, with a reset helper.
  - Rejects a visit that double-books a doctor.
  - Allows only valid invoice transitions: draft → sent → paid or overdue; void unless paid.
  - Rejects a duplicate phone number on registration as a field error.
  - A test-only failure hook forces errors.
- **Names:** each seeded name is shown in the active language.

## Routes and navigation

| Route | Page | Sidebar |
|---|---|---|
| `/dashboard` | Operations dashboard (replaces the placeholder) | Dashboard |
| `/schedule` | Schedule | Schedule |
| `/patients` | Patients list | Patients |
| `/patients/new` | New patient intake | (header action on Patients) |
| `/patients/:id` | Patient profile | — |
| `/billing` | Billing | Billing |

Members and Settings keep their routes and menu entries. Routes are added to `FULL_ROUTES_PATH`, `APP_MENU` and the router.

## Pages

### Operations dashboard (`/dashboard`)

- **Header:** a PageHeader with a range Select (7, 30 or 90 days).
- **Stat row:** four StatCards, each with a trend and a Sparkline: Visits, New patients, No-show rate, Revenue (Money). Each card links to a filtered list:
  - Visits → `/schedule?view=agenda`
  - New patients → `/patients?sort=created`
  - No-show rate → `/schedule?view=agenda`
  - Revenue → `/billing`
- **Charts:** visits per day as an AreaChart (completed vs no-show); revenue by doctor as a BarChart; payer mix (insurance vs self-pay) as a DonutChart. Each keeps the "View as table" fallback.
- **Today:** a compact Timeline of today's upcoming visits.

### Schedule (`/schedule`)

- **Grid:** CalendarGrid with the four doctors as `resources`, resource-keyed `slots`, and day, week, agenda and month views (`ViewTabs views`). View and date sync to the URL (`?view=`, `?date=`).
- **Create:** `onSlotSelect` opens a Sheet holding a patient Combobox, the visit type, notes and the selected time and doctor. Saving creates the visit.
- **Move and resize:** these save through `onEventChange`. A double-booking is rejected by the store, so the visit reverts with a toast.
- **Locks:** `canEdit` locks completed visits and visits in the past.
- **Popover:** shows the patient, time, doctor and status, with "Open profile" and "Mark arrived" / "Mark no-show".
- **All-day row:** doctor leave days.

### Patients (`/patients`)

- **Table:** a DataTable with search and filters for doctor, insurer and last-visit date range. It is sortable and paginated, and filters persist in the URL.
- **Links:** rows open the profile, and the header has a "New patient" action that opens intake.

### Patient profile (`/patients/:id`)

- **Header:** a PageHeader with `media` (Avatar) and `meta` (MRN, age, phone, insurer Badge).
- **Header actions:** "Book visit" navigates to `/schedule?patient=<id>`; the next slot picked there opens the create Sheet with that patient preselected. "Edit" opens a Sheet with the contact fields.
- **Stat row:** Visits this year, Balance due (Money), Last visit.
- **Tabs:**
  - **Overview:** a DescriptionList of details, with allergies as Tags.
  - **Timeline:** visits, payments and notes, grouped by day.
  - **Invoices:** this patient's invoices in a DataTable.
- **Not found:** an unknown id shows an EmptyState with a link back to Patients.

### Billing (`/billing`)

- **Summary:** StatCards for Outstanding, Overdue and Collected this month.
- **Invoices:**
  - A DataTable with status tabs (All, Draft, Sent, Overdue, Paid, Void), Money columns and bulk selection.
  - Bulk actions: "Send reminders", "Mark paid" (through a ConfirmDialog) and "Export CSV".
  - Bulk results report partial failures, for example "3 marked paid, 1 skipped (void)".
- **Invoice Sheet:** opened from a row. It shows line items and payments and holds a "Record payment" form (amount as Money, method, date).

### New patient (`/patients/new`)

- **Wizard:** FormWizard with Patient → Contact → Insurance (conditional and optional) → Documents → Review, using `draftKey` and `urlSync`.
- **Errors:** a duplicate phone number comes back as a `FormWizardError` on the Contact step.
- **Success:** a toast, then navigation to the new patient's profile.

## Testing

- **Mock backend:** unit tests cover seed determinism, store invariants (double-booking, invoice transitions, duplicate phone) and session persistence and reset.
- **Pages:** each page gets happy-dom tests against the real handlers through a test QueryClient with latency 0. They cover:
  - the main flow
  - the empty and error states, through the store's failure hook
  - English and Arabic copy
- **Cross-links:** route tests for:
  - finishing intake opens the new profile
  - the schedule popover's "Open profile" opens the right patient
  - a dashboard card opens the filtered list
  - "Book visit" on a profile preselects the patient
- **Browser check:** every page at 1440 px and 390 px, in light and dark; Schedule and Billing also in Arabic.
- **Gate:** each plan ends with the full gate: `ds:baseline`, `vp fmt`, `vp check`, `tsc -b`, `tsc -p tsconfig.scripts.json`, `docs:lint`, `vp test --run src tests` and `vp build`. The docs must still be absent from `dist`.

## Work order

1. **Plan A:** clinic mock backend and query hooks, routes and sidebar, Patients list.
2. **Plan B:** Operations dashboard and Billing.
3. **Plan C:** Schedule and Patient profile.
4. **Plan D:** New patient intake, cross-links, and the exit browser check.

## Out of scope

- Auth, roles and permissions; real API wiring.
- Printing or PDF invoices, email or SMS delivery, notifications.
- Clinic configuration settings, recurring visits, multi-clinic support.
