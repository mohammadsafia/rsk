// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { queryClient as appQueryClient } from '@api/config';
import { NuqsAdapter } from 'nuqs/adapters/react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { clinicStore } from '@api/clinic';
import { Toaster } from '@components/shared';
import { Tooltip } from '@components/ui';

import BillingPage from './billing/BillingPage';
import OperationsDashboard from './dashboard/OperationsDashboard';
import NewPatientPage from './intake/NewPatientPage';
import PatientProfilePage from './patient-profile/PatientProfilePage';
import PatientsPage from './patients/PatientsPage';
import SchedulePage from './schedule/SchedulePage';
import { resetClinic } from './test-utils';

import '../../i18n';

/** The clinic as the app wires it: a browser router on the real history, and nuqs's React adapter (bootstrap.tsx). */
const renderApp = (route: string) => {
  window.history.replaceState(null, '', route);
  return render(
    <StrictMode>
      <NuqsAdapter>
        {/* The app's query options (bootstrap.tsx), in a fresh client per test. */}
        <QueryClientProvider client={new QueryClient({ defaultOptions: appQueryClient.getDefaultOptions() })}>
          <Tooltip.Provider>
            <BrowserRouter>
              <Routes>
                <Route path="/dashboard" element={<OperationsDashboard />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/patients" element={<PatientsPage />} />
                <Route path="/patients/new" element={<NewPatientPage />} />
                <Route path="/patients/:id" element={<PatientProfilePage />} />
                <Route path="/billing" element={<BillingPage />} />
              </Routes>
              <Toaster />
            </BrowserRouter>
          </Tooltip.Provider>
        </QueryClientProvider>
      </NuqsAdapter>
    </StrictMode>,
  );
};

beforeEach(() => {
  resetClinic();
  // Layout for the schedule grid: 200px columns from x=100, 07:00–18:00 over 1100px.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const index = Number(this.dataset.columnIndex ?? -1);
    if (this.dataset.calendarColumn !== undefined) return DOMRect.fromRect({ x: 100 + index * 200, y: 0, width: 200, height: 1100 });
    if (this.dataset.slot === 'calendar-grid-body') return DOMRect.fromRect({ x: 0, y: 0, width: 1600, height: 1100 });
    return DOMRect.fromRect({ x: 600, y: 240, width: 600, height: 240 });
  });
});
afterEach(async () => {
  await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
  cleanup();
  vi.restoreAllMocks();
  clinicStore.setClock(null);
  window.history.replaceState(null, '', '/');
});

const at = (column: number, minute: number) => ({ clientX: 150 + column * 200, clientY: (minute - 7 * 60) / 0.6 });
const path = () => `${window.location.pathname}${window.location.search}`;

describe('clinic cross-links', () => {
  it('dashboard "New patients" opens Patients, newest registration first', async () => {
    renderApp('/dashboard');
    fireEvent.click(await screen.findByRole('link', { name: /^New patients/ }));
    const newest = [...clinicStore.read().patients].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
    await screen.findByText(newest.name.en);
    expect(path()).toBe('/patients?sort=created');
    expect(screen.getAllByRole('row')[1].textContent).toContain(newest.name.en);
  });

  it('a schedule visit popover opens the patient profile', async () => {
    renderApp('/schedule');
    const visit = clinicStore.read().visits.find((v) => v.start.startsWith('2026-10-16') && v.status === 'scheduled')!;
    const patient = clinicStore.read().patients.find((p) => p.id === visit.patientId)!;
    const card = await waitFor(() => {
      const element = document.querySelector(`[data-event-id="${visit.id}"]`) as HTMLElement | null;
      expect(element).not.toBeNull();
      return element!;
    });
    fireEvent.click(card);
    fireEvent.click(await screen.findByRole('link', { name: 'Open profile' }));
    expect(await screen.findByRole('heading', { level: 1, name: patient.name.en })).toBeTruthy();
    expect(path()).toBe(`/patients/${patient.id}`);
  });

  it('Book visit on a profile preselects the patient for the next slot on the Schedule', async () => {
    const patient = clinicStore.read().patients[3];
    renderApp(`/patients/${patient.id}`);
    fireEvent.click(await screen.findByRole('link', { name: 'Book visit' }));
    await waitFor(() => expect(document.querySelectorAll('[data-calendar-column]').length).toBeGreaterThan(0));
    expect(path()).toBe(`/schedule?patient=${patient.id}&view=week`);
    // Pick a free afternoon cell on the patient's doctor's Saturday (the 17th is in this week).
    const { visits } = clinicStore.read();
    const minute = (iso: string) => new Date(iso).getHours() * 60 + new Date(iso).getMinutes();
    const busy = visits.filter(
      (v) => v.doctorId === patient.primaryDoctorId && v.start.startsWith('2026-10-17') && v.status !== 'cancelled',
    );
    let free = 13 * 60;
    while (busy.some((v) => free < minute(v.end) && free + 15 > minute(v.start))) free += 15;
    const saturday = document.querySelector('[data-calendar-column][data-day="2026-10-17"]') as HTMLElement;
    const index = Number(saturday.getAttribute('data-column-index'));
    fireEvent.pointerDown(saturday, { button: 0, pointerId: 1, ...at(index, free) });
    fireEvent.pointerUp(window, { pointerId: 1, ...at(index, free) });
    const sheet = await screen.findByRole('dialog', { name: 'New visit' });
    expect(within(sheet).getByText(patient.name.en)).toBeTruthy();
  });

  it('a profile invoice opens Billing with that invoice', async () => {
    const invoice = clinicStore.read().invoices[0];
    renderApp(`/patients/${invoice.patientId}?tab=invoices`);
    fireEvent.click(await screen.findByRole('link', { name: new RegExp(invoice.number) }));
    expect(await screen.findByRole('dialog', { name: invoice.number })).toBeTruthy();
    expect(path()).toBe(`/billing?invoice=${invoice.id}`);
  });

  it('a registered patient opens on their profile and is listed in Patients', async () => {
    renderApp('/patients');
    fireEvent.click((await screen.findAllByRole('link', { name: 'New patient' }))[0]);
    expect(await screen.findByRole('heading', { level: 1, name: 'New patient' })).toBeTruthy();
    const type = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
    type(/^First name\s*\*?$/, 'Huda');
    type(/^Last name\s*\*?$/, 'Saadeh');
    const dob = screen.getByLabelText(/^Date of birth/);
    fireEvent.change(dob, { target: { value: '05/14/1990' } });
    fireEvent.blur(dob);
    fireEvent.click(screen.getByRole('combobox', { name: /Primary doctor/ }));
    fireEvent.click(await screen.findByRole('option', { name: 'Dr. Lina Haddad' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'Contact' });
    type(/^Phone/, '+962 79 555 0303');
    for (const heading of ['Documents', 'Review']) {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      await screen.findByRole('heading', { name: heading });
    }
    // Let the wizard's ?step=review write land before leaving the page.
    await waitFor(() => expect(path()).toContain('step=review'));
    fireEvent.click(screen.getByRole('button', { name: 'Register patient' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Huda Saadeh' })).toBeTruthy();
    const created = clinicStore.read().patients.find((p) => p.name.en === 'Huda Saadeh')!;
    expect(path()).toBe(`/patients/${created.id}`);

    fireEvent.click(screen.getByRole('link', { name: /back|Patients/i }));
    // The list is alphabetical over 61 patients; search for the new one (and wait out the search debounce).
    fireEvent.change(await screen.findByPlaceholderText('Search by name, MRN or phone'), { target: { value: 'Saadeh' } });
    expect(await screen.findByRole('link', { name: 'Huda Saadeh' }, { timeout: 2000 })).toBeTruthy();
  });
});
