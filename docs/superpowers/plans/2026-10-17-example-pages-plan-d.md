# Clinic example pages — Plan D: New patient intake, cross-links and exit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**
- **`/patients/new`:** a FormWizard intake with these steps:
  - Patient
  - Contact
  - Insurance: conditional and optional
  - Documents
  - Review

  It keeps a session draft, syncs the current step to `?step=`, sends a duplicate phone back to the Contact step, and opens the new profile on success.
- **Route-level tests** for the spec's cross-links, and the final check of the clinic as a whole.

**Architecture:**
- **Page:** `src/pages/clinic/intake/NewPatientPage.tsx` owns one react-hook-form instance and a `FormWizard` (from `@components/forms`).
- **Submit:** `onSubmit` maps the form to `NewPatientInput` and calls `useRegisterPatient().mutateAsync`.
- **Errors:** a `ClinicError` with `fieldErrors` is rethrown as a `FormWizardError`, so the wizard routes it to the owning step.
- **Success:** a toast, then `navigate(patientPath(id), { replace: true })`.
- **Cross-link tests:** a router-level test file renders the real clinic routes in a `MemoryRouter`.

**Tech Stack:** React 18, react-hook-form + zod, `FormWizard` (kit-depth Plan C), react-query 4, nuqs, react-router 6, Vitest + Testing Library (happy-dom).

**Spec:** `docs/superpowers/specs/2026-10-16-example-pages-design.md` (New patient, Testing → cross-links).

## Global Constraints

- Semantic tokens only; `ds:baseline` stays `{}`. Every field keeps Input's height.
- English and Arabic for all copy in `clinic.json`, with full Arabic plurals. RTL-correct, with LTR-isolated phone and email.
- Mutations show loading and a toast. Production code never imports `@component-docs/*`. No new dependencies.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Tests use `renderClinic` and `resetClinic`.

## Rulings (decided here)

- **Documents** are collected through `FormFileUploader`, but the mock backend stores no files. The Review step shows "{{count}} files" (full plurals), and registration ignores them. A real API would upload them.
- **Insurance:** "The patient has insurance" (a checkbox on the Patient step) shows the Insurance step through `condition`. The step is `optional`, so "Skip" is offered. With no insurance, `insurerId` and `policyNumber` are null.
- **Date of birth** uses `FormDatePicker` (`yyyy-MM-dd`). It is required and cannot be in the future.
- **Primary doctor** is a required `FormSelect` on the Patient step.
- **Draft key** is `clinic-intake`. The wizard clears it on a successful submit (FormWizard behaviour).
- **Cancel** goes back to `/patients`; FormWizard confirms first when the form is dirty.

## Review Focus

1. **A duplicate phone at submit** lands on the Contact step with the error on Phone, and nothing registers. → Task 1 test.
2. **Unticking "has insurance"** after filling Insurance means the stored patient has `insurerId: null`, not the stale insurer. → Task 1 test.
3. **A reload mid-wizard** restores the draft and the step, without files. This relies on FormWizard's draft and is checked in the browser exit.
4. **The new patient appears in the Patients list** right after registering, because the cache was invalidated. → Task 2 cross-link test.
5. **Book visit preselects in the Schedule:** a profile's Book visit opens the Schedule, and picking a slot shows that patient preselected. → Task 2 test.

---

### Task 1: New patient intake page

**Files:**
- Create: `src/pages/clinic/intake/NewPatientPage.tsx` (+ test)
- Modify: `src/routes/router.tsx` (lazy route `/patients/new`, declared before `/patients/:id`), `clinic.json` (`intake.*`)

**Form values:**

```ts
type IntakeValues = {
  firstNameEn: string; lastNameEn: string; firstNameAr: string; lastNameAr: string;
  sex: 'female' | 'male'; dob: string; primaryDoctorId: string; insured: boolean;
  phone: string; email: string;
  insurerId: string; policyNumber: string;
  documents: File[];
};
```

**Steps:**
1. **Patient:** the four name fields (English names required; Arabic names optional, falling back to the English), sex, date of birth and primary doctor, plus the "The patient has insurance" checkbox. Schema keys: names, sex, dob, primaryDoctorId.
2. **Contact:** phone (required, `dir=ltr`) and email (optional, valid format).
3. **Insurance:** `condition={insured}`, `optional`. Insurer is required and policy number is required.
4. **Documents:** a `FormFileUploader` with `multiple` and `listVariant="chips"`.
5. **Review:** the rows from each step.

**Mapping on submit:**
- `name` is `{ en: \`${firstNameEn} ${lastNameEn}\`, ar: (Arabic names, or the English when empty) }`.
- `email` is null when empty.
- `allergies: []`.
- With no insurance, `insurerId` and `policyNumber` are null.

- [ ] **Step 1: Write the failing tests**

```tsx
// @vitest-environment happy-dom
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { clinicStore } from '@api/clinic';
import { Toaster } from '@components/shared';

import i18n from '../../../i18n';
import { renderClinic, resetClinic } from '../test-utils';
import NewPatientPage from './NewPatientPage';

beforeEach(resetClinic);
afterEach(async () => {
  cleanup();
  clinicStore.setClock(null);
  await act(() => i18n.changeLanguage('en'));
});

const renderPage = () =>
  renderClinic(
    <>
      <NewPatientPage />
      <Toaster />
    </>,
    { route: '/patients/new', path: '/patients/new' },
  );

const type = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const next = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
};

/** Fills the Patient step through the real fields (the date picker accepts typed MM/DD/YYYY). */
const fillPatient = async ({ insured = false } = {}) => {
  type(/^First name/, 'Huda');
  type(/^Last name/, 'Saadeh');
  fireEvent.click(screen.getByRole('radio', { name: 'Female' }));
  const dob = screen.getByLabelText(/^Date of birth/);
  fireEvent.change(dob, { target: { value: '05/14/1990' } });
  fireEvent.blur(dob);
  fireEvent.click(screen.getByRole('combobox', { name: /Primary doctor/ }));
  fireEvent.click(await screen.findByRole('option', { name: 'Dr. Lina Haddad' }));
  if (insured) fireEvent.click(screen.getByRole('checkbox', { name: 'The patient has insurance' }));
};

describe('NewPatientPage', () => {
  it('registers a patient through the steps and opens their profile', async () => {
    renderPage();
    await fillPatient();
    await next();
    await screen.findByRole('heading', { name: 'Contact' });
    type(/^Phone/, '+962 79 555 0101');
    await next();
    await screen.findByRole('heading', { name: 'Documents' });
    await next();
    await screen.findByRole('heading', { name: 'Review' });
    fireEvent.click(screen.getByRole('button', { name: 'Register patient' }));
    expect(await screen.findByText('Patient registered')).toBeTruthy();
    const created = clinicStore.read().patients.find((p) => p.name.en === 'Huda Saadeh')!;
    expect(created).toMatchObject({ phone: '+962 79 555 0101', insurerId: null, email: null });
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe(`/patients/${created.id}`));
  });

  it('sends a duplicate phone back to the Contact step', async () => {
    const taken = clinicStore.read().patients[0].phone;
    renderPage();
    await fillPatient();
    await next();
    await screen.findByRole('heading', { name: 'Contact' });
    type(/^Phone/, taken);
    await next();
    await screen.findByRole('heading', { name: 'Documents' });
    await next();
    await screen.findByRole('heading', { name: 'Review' });
    fireEvent.click(screen.getByRole('button', { name: 'Register patient' }));
    expect(await screen.findByRole('heading', { name: 'Contact' })).toBeTruthy();
    expect(await screen.findByText('That phone number is already registered')).toBeTruthy();
    expect(clinicStore.read().patients.some((p) => p.name.en === 'Huda Saadeh')).toBe(false);
  });

  it('shows the Insurance step only for insured patients, and drops it when unticked', async () => {
    renderPage();
    await fillPatient({ insured: true });
    await next();
    await screen.findByRole('heading', { name: 'Contact' });
    type(/^Phone/, '+962 79 555 0102');
    await next();
    await screen.findByRole('heading', { name: 'Insurance' });
    fireEvent.click(screen.getByRole('combobox', { name: /Insurer/ }));
    fireEvent.click(await screen.findByRole('option', { name: 'Petra Health' }));
    type(/^Policy number/, 'POL-777777');
    // Back to Patient and untick: the Insurance step disappears and its values are not saved.
    fireEvent.click(screen.getByRole('button', { name: /Patient/ }));
    await screen.findByRole('heading', { name: 'Patient' });
    fireEvent.click(screen.getByRole('checkbox', { name: 'The patient has insurance' }));
    for (const heading of ['Contact', 'Documents', 'Review']) {
      await next();
      await screen.findByRole('heading', { name: heading });
    }
    fireEvent.click(screen.getByRole('button', { name: 'Register patient' }));
    await screen.findByText('Patient registered');
    expect(clinicStore.read().patients.find((p) => p.name.en === 'Huda Saadeh')).toMatchObject({ insurerId: null, policyNumber: null });
  });

  it('renders in Arabic', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderPage();
    expect(await screen.findByRole('heading', { level: 1, name: 'مريض جديد' })).toBeTruthy();
  });
});
```

(If the date picker doesn't accept typed text in happy-dom, set the value through the form instead, with a test-only `defaultValues` override. Record that as a ruling.)

- [ ] **Step 2: Run** — FAIL. **Step 3: Implement.** **Step 4: Run** — PASS. **Step 5: Commit** — `feat(clinic): new patient intake wizard`

---

### Task 2: Cross-link tests across the clinic

**Files:** `src/pages/clinic/cross-links.test.tsx`. This adds no new production code unless a test exposes a gap; if one does, fix it test-first and ledger it.

The harness renders the clinic routes, all five pages plus the location probe, in one `MemoryRouter`, with each page at its real path:

```tsx
const renderApp = (route: string) =>
  render(
    <NuqsTestingAdapter searchParams={new URL(route, 'http://clinic.test').search} hasMemory>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <Tooltip.Provider>
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route path="/dashboard" element={<OperationsDashboard />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/patients/new" element={<NewPatientPage />} />
              <Route path="/patients/:id" element={<PatientProfilePage />} />
              <Route path="/billing" element={<BillingPage />} />
            </Routes>
            <Toaster />
          </MemoryRouter>
        </Tooltip.Provider>
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  );
```

Tests:
1. **Dashboard to filtered list:** the "New patients" card on the dashboard opens Patients sorted newest first. Its first row is the newest registration.
2. **Schedule popover to profile:** "Open profile" in a schedule visit's popover opens that patient's profile, and the heading is their name.
3. **Profile to Schedule:** Book visit on a profile opens the Schedule with `?patient=` set. Picking a free slot then shows the new-visit Sheet with that patient selected.
4. **Profile invoice to Billing:** an invoice link on a profile's Invoices tab opens Billing with that invoice's Sheet.
5. **Intake to profile to list:** finishing intake opens the new profile, and going to Patients lists the new patient.

- [ ] **Step 1: Write the tests.** **Step 2: Run** — any failure is a real cross-link gap: fix it test-first. **Step 3: Commit** — `test(clinic): cross-links between the clinic pages`

---

### Task 3: Exit — gate and browser check of the whole clinic

- [ ] **Full gate:** run the full gate as in Plan B.
- [ ] **Browser walk:** at 1440 px in light and dark, then Arabic, then 390 px:
  - Dashboard → Schedule (book a visit) → Patients → New patient (fill, reload mid-way to see the draft restored, then submit) → the new profile → Book visit → Billing (record a payment).
  - Fix findings test-first.
- [ ] **Commit:** `test(clinic): Plan D exit — the whole clinic, gate and browser walk`.
