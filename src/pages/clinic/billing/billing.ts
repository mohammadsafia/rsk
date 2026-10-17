import { type Invoice, invoiceBalance, type InvoiceStatus, invoiceTotal, type Localized, type Patient } from '@api/clinic';

export type InvoiceRow = Invoice & { patientName: string; total: number; balance: number };

export const toInvoiceRows = (
  invoices: Invoice[],
  patients: Pick<Patient, 'id' | 'name'>[],
  localize: (value: Localized | undefined) => string,
): InvoiceRow[] => {
  const names = new Map(patients.map((patient) => [patient.id, patient.name]));
  return invoices.map((invoice) => ({
    ...invoice,
    patientName: localize(names.get(invoice.patientId)),
    total: invoiceTotal(invoice),
    balance: invoiceBalance(invoice),
  }));
};

const cents = (value: number) => Math.round(value * 100) / 100;

export const billingSummary = (invoices: Invoice[], todayKey: string) => {
  const open = invoices.filter((invoice) => invoice.status === 'sent' || invoice.status === 'overdue');
  const overdue = open.filter((invoice) => invoice.status === 'overdue');
  const month = todayKey.slice(0, 7);
  return {
    outstanding: cents(open.reduce((sum, invoice) => sum + invoiceBalance(invoice), 0)),
    overdue: cents(overdue.reduce((sum, invoice) => sum + invoiceBalance(invoice), 0)),
    overdueCount: overdue.length,
    collectedThisMonth: cents(
      invoices
        .flatMap((invoice) => invoice.payments)
        .filter((payment) => payment.date.startsWith(month))
        .reduce((sum, payment) => sum + payment.amount, 0),
    ),
  };
};

const field = (value: string) => `"${value.replaceAll('"', '""')}"`;

/** Text that a spreadsheet would run as a formula (=, +, -, @, tab, CR) is prefixed with ' to stay text. */
const safeText = (value: string) => (/^[=+\-@\t\r]/.test(value) ? `'${value}` : value);

/** CSV for spreadsheets: every field quoted, CRLF lines, and a BOM so Excel reads UTF-8 (Arabic names) correctly. */
export const invoicesToCsv = (
  rows: InvoiceRow[],
  headers: Record<'number' | 'patient' | 'issued' | 'due' | 'status' | 'total' | 'balance', string>,
  statusLabel: (status: InvoiceStatus) => string,
) => {
  const lines = [
    [headers.number, headers.patient, headers.issued, headers.due, headers.status, headers.total, headers.balance],
    ...rows.map((row) => [
      safeText(row.number),
      safeText(row.patientName),
      row.issuedAt,
      row.dueAt,
      safeText(statusLabel(row.status)),
      row.total.toFixed(2),
      row.balance.toFixed(2),
    ]),
  ];
  return `\uFEFF${lines.map((cells) => cells.map(field).join(',')).join('\r\n')}`;
};

/** Saves text as a file: the link is attached while clicked (some browsers ignore detached links) and the URL freed after. */
export const downloadCsv = (filename: string, csv: string) => {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = Object.assign(document.createElement('a'), { href: url, download: filename, hidden: true });
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
