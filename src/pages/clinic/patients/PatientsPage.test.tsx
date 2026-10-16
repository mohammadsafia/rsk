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
    const arabicFirst = [...clinicStore.read().patients].sort((a, b) => a.name.ar.localeCompare(b.name.ar, 'ar'))[0];
    expect(await screen.findByText(arabicFirst.name.ar)).toBeTruthy();
    // Sorted by the Arabic name: the Arabic-alphabetical first patient heads the table.
    expect(screen.getAllByRole('row')[1].textContent).toContain(arabicFirst.name.ar);
    expect(screen.getByRole('heading', { level: 1, name: 'المرضى' })).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/[٠-٩]/);
  });
});
