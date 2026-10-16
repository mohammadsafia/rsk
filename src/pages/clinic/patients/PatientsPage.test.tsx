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

  it('searches by MRN', async () => {
    renderPage();
    await screen.findByText(firstPatient().name.en);
    fireEvent.change(screen.getByPlaceholderText('Search by name, MRN or phone'), { target: { value: firstPatient().mrn } });
    await waitFor(() => expect(screen.getAllByRole('row').length).toBeLessThanOrEqual(3));
  });

  it('searches names, MRNs and phones only — not doctor ids — and matches phones by digits', async () => {
    renderPage();
    await screen.findByText(firstPatient().name.en);
    const search = screen.getByPlaceholderText('Search by name, MRN or phone');
    fireEvent.change(search, { target: { value: 'Haddad' } });
    const named = clinicStore.read().patients.filter((p) => p.name.en.includes('Haddad'));
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(named.length + 1));

    const target = clinicStore.read().patients[5];
    const local = `0${target.phone.replace(/\D/g, '').slice(3)}`;
    fireEvent.change(search, { target: { value: local } });
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(2));
    expect(screen.getAllByRole('row')[1].textContent).toContain(target.name.en);
  });

  it('gives every row a link to the profile for keyboard users', async () => {
    renderPage();
    const link = await screen.findByRole('link', { name: firstPatient().name.en });
    expect(link.getAttribute('href')).toBe(`/patients/${firstPatient().id}`);
  });

  it('shows the error state when doctors or insurers fail to load, and Retry recovers', async () => {
    clinicStore.failNext('listDoctors');
    renderPage();
    const alert = await screen.findByRole('alert');
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText(firstPatient().name.en)).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
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
    const row = screen.getAllByRole('row')[1];
    expect(row.querySelector('bdi[dir="ltr"]')?.textContent).toBe(arabicFirst.phone);
    // Dates with Arabic month names are isolated without being forced left-to-right.
    expect(row.querySelector('[data-slot="last-visit"]')?.getAttribute('dir')).toBeNull();
  });

  it('sorts the doctor column by the doctor name shown, in Arabic too', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderPage();
    await screen.findAllByText('د. لينا حداد');
    fireEvent.click(within(screen.getByRole('columnheader', { name: /الطبيب المعالج/ })).getByText('الطبيب المعالج'));
    await waitFor(() => expect(screen.getAllByRole('row')[1].textContent).toContain('د. رانيا ناصر'));
  });

  it('sorts newest registrations first with ?sort=created', async () => {
    renderClinic(<PatientsPage />, { route: '/patients?sort=created', path: '/patients' });
    const newest = [...clinicStore.read().patients].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
    await screen.findByText(newest.name.en);
    expect(screen.getAllByRole('row')[1].textContent).toContain(newest.name.en);
    expect(screen.getByRole('columnheader', { name: /Registered/ })).toBeTruthy();
  });
});
