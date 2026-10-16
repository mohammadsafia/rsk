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
    await screen.findByText('Outstanding');
    await waitFor(() => expect(screen.getAllByRole('row').length).toBeGreaterThan(2));
    // Select both rows by searching each number, ticking the row checkbox.
    const search = screen.getByPlaceholderText('Search by number or patient');
    for (const number of [open.number, paid.number]) {
      fireEvent.change(search, { target: { value: number } });
      // Search is debounced: wait until the only row is the one asked for.
      await waitFor(() => {
        expect(screen.getAllByRole('row')).toHaveLength(2);
        expect(screen.getAllByRole('row')[1].textContent).toContain(number);
      });
      fireEvent.click(within(screen.getAllByRole('row')[1]).getByRole('checkbox'));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Mark paid' }));
    fireEvent.click(
      within(await screen.findByRole('dialog', { name: 'Mark 2 invoices paid?' })).getByRole('button', { name: 'Mark paid' }),
    );
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
    const newest = [...clinicStore.read().invoices].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt) || b.id.localeCompare(a.id))[0];
    await screen.findByText(newest.number);
    expect(document.body.textContent).not.toMatch(/[٠-٩]/);
  });
});
