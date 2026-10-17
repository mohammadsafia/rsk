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

const renderProfile = (id: string, search = '') =>
  renderClinic(<PatientProfilePage />, { route: `/patients/${id}${search}`, path: '/patients/:id' });

/** A patient with visits and at least one open invoice. */
const richPatient = () => {
  const { patients, invoices, visits } = clinicStore.read();
  return patients.find(
    (p) =>
      visits.some((v) => v.patientId === p.id) &&
      invoices.some((i) => i.patientId === p.id && invoiceBalance(i) > 0 && (i.status === 'sent' || i.status === 'overdue')),
  )!;
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

  it('names the primary doctor on the overview', async () => {
    const patient = richPatient();
    const doctor = clinicStore.read().doctors.find((d) => d.id === patient.primaryDoctorId)!;
    renderProfile(patient.id);
    await screen.findByRole('heading', { level: 1, name: patient.name.en });
    expect(await screen.findByText(doctor.name.en)).toBeTruthy();
  });

  it('refuses a phone number without enough digits', async () => {
    const patient = richPatient();
    renderProfile(patient.id);
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    const sheet = await screen.findByRole('dialog', { name: 'Edit contact details' });
    fireEvent.change(within(sheet).getByLabelText(/^Phone/), { target: { value: 'abc' } });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Save' }));
    expect(await within(sheet).findByText('Enter a valid phone number')).toBeTruthy();
    expect(clinicStore.read().patients.find((p) => p.id === patient.id)!.phone).toBe(patient.phone);
  });
});
