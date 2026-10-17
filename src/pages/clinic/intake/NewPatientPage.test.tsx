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

const renderPage = () => renderClinic(<NewPatientPage />, { route: '/patients/new', path: '/patients/new', outside: <Toaster /> });

const type = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const next = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
};

/** Fills the Patient step through the real fields (the date picker accepts typed MM/DD/YYYY). */
const fillPatient = async ({ insured = false } = {}) => {
  type(/^First name\s*\*?$/, 'Huda');
  type(/^Last name\s*\*?$/, 'Saadeh');
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
