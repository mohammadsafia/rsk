// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vite-plus/test';

import type { Invoice } from '@api/clinic';

import { billingSummary, downloadCsv, invoicesToCsv, type InvoiceRow } from './billing';
import { paymentSchema } from './paymentSchema';

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

describe('CSV safety and download', () => {
  it('neutralises cells that spreadsheets would run as formulas', () => {
    const rows = [{ ...invoice({}), patientName: '=HYPERLINK("x")', total: 40, balance: 40 }] as InvoiceRow[];
    const csv = invoicesToCsv(rows, { number: 'N', patient: 'P', issued: 'I', due: 'D', status: 'S', total: 'T', balance: 'B' }, (s) => s);
    expect(csv.split('\r\n')[1]).toContain('"\'=HYPERLINK(""x"")"');
  });

  it('attaches the link while clicking it and revokes the URL afterwards', async () => {
    vi.useFakeTimers();
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    let attached = false;
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      attached = document.body.contains(this);
    });
    downloadCsv('x.csv', 'a,b');
    expect(attached).toBe(true);
    expect(revoke).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith('blob:x');
    expect(document.querySelector('a[download="x.csv"]')).toBeNull();
    [create, revoke, click].forEach((spy) => spy.mockRestore());
    vi.useRealTimers();
  });
});

describe('payment schema', () => {
  const t = (key: string) => key;
  it('rejects 0, more than the balance and future dates', () => {
    const schema = paymentSchema({ t, balance: 40, balanceLabel: '$40.00', todayKey: '2026-10-16' });
    expect(schema.safeParse({ amount: 40, method: 'card', date: '2026-10-16' }).success).toBe(true);
    expect(schema.safeParse({ amount: 0, method: 'card', date: '2026-10-16' }).success).toBe(false);
    expect(schema.safeParse({ amount: 41, method: 'card', date: '2026-10-16' }).success).toBe(false);
    const future = schema.safeParse({ amount: 10, method: 'card', date: '2026-10-17' });
    expect(future.success).toBe(false);
    expect(future.error?.issues[0].message).toBe('billing.sheet.record.dateFuture');
    expect(schema.safeParse({ amount: 10, method: 'card', date: '' }).error?.issues[0].message).toBe('billing.sheet.record.dateRequired');
  });
});
