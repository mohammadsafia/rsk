import { describe, expect, it } from 'vite-plus/test';

import type { Invoice } from '@api/clinic';

import { billingSummary, invoicesToCsv, type InvoiceRow } from './billing';

const invoice = (overrides: Partial<Invoice>): Invoice => ({
  id: 'inv-1',
  number: 'INV-2026-0001',
  patientId: 'pt-1',
  visitId: null,
  issuedAt: '2026-10-01',
  dueAt: '2026-10-15',
  status: 'sent',
  lines: [{ id: 'l1', service: 'consultation', quantity: 1, unitPrice: 40 }],
  payments: [],
  ...overrides,
});

describe('billing summary', () => {
  it('sums outstanding and overdue balances and this month’s payments', () => {
    const summary = billingSummary(
      [
        invoice({ id: 'a', status: 'sent' }),
        invoice({ id: 'b', status: 'overdue', payments: [{ id: 'p', amount: 10, method: 'cash', date: '2026-10-05' }] }),
        invoice({ id: 'c', status: 'paid', payments: [{ id: 'q', amount: 40, method: 'card', date: '2026-09-30' }] }),
        invoice({ id: 'd', status: 'void' }),
        invoice({ id: 'e', status: 'draft' }),
      ],
      '2026-10-16',
    );
    expect(summary).toEqual({ outstanding: 70, overdue: 30, overdueCount: 1, collectedThisMonth: 10 });
  });
});

describe('invoices CSV', () => {
  it('quotes and escapes fields, keeps Arabic, and starts with a BOM', () => {
    const rows = [{ ...invoice({}), patientName: 'سارة "Sara", حداد', total: 40, balance: 40 }] as InvoiceRow[];
    const csv = invoicesToCsv(
      rows,
      { number: 'Number', patient: 'Patient', issued: 'Issued', due: 'Due', status: 'Status', total: 'Total', balance: 'Balance' },
      (status) => status.toUpperCase(),
    );
    expect(csv.startsWith('﻿')).toBe(true);
    const [header, line] = csv.slice(1).split('\r\n');
    expect(header).toBe('"Number","Patient","Issued","Due","Status","Total","Balance"');
    expect(line).toBe('"INV-2026-0001","سارة ""Sara"", حداد","2026-10-01","2026-10-15","SENT","40.00","40.00"');
  });
});
