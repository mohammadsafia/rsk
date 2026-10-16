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

const openInvoice = () =>
  clinicStore.read().invoices.find((i) => (i.status === 'sent' || i.status === 'overdue') && i.payments.length === 0)!;

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
    const amount = within(sheet).getByLabelText(/^Amount/);
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
    fireEvent.change(within(sheet).getByLabelText(/^Amount/), { target: { value: String(invoiceBalance(invoice)) } });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Record payment' }));
    expect(await screen.findByText('Payment recorded')).toBeTruthy();
    await waitFor(() => expect(clinicStore.read().invoices.find((i) => i.id === invoice.id)!.status).toBe('paid'));
  });

  it('voids an open invoice after confirming', async () => {
    const invoice = openInvoice();
    renderWith(invoice.id);
    const sheet = await screen.findByRole('dialog', { name: invoice.number });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Void invoice' }));
    fireEvent.click(
      within(await screen.findByRole('dialog', { name: `Void ${invoice.number}?` })).getByRole('button', { name: 'Void invoice' }),
    );
    await waitFor(() => expect(clinicStore.read().invoices.find((i) => i.id === invoice.id)!.status).toBe('void'));
  });

  it('shows "not found" for an unknown invoice', async () => {
    renderWith('inv-nope');
    expect(await screen.findByText('Invoice not found')).toBeTruthy();
  });
});
