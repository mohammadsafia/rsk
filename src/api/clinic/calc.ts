import type { Invoice } from './types';

const cents = (value: number) => Math.round(value * 100) / 100;

export const invoiceTotal = (invoice: Invoice) => cents(invoice.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0));
export const invoicePaid = (invoice: Invoice) => cents(invoice.payments.reduce((sum, payment) => sum + payment.amount, 0));
export const invoiceBalance = (invoice: Invoice) => (invoice.status === 'void' ? 0 : cents(invoiceTotal(invoice) - invoicePaid(invoice)));

/** Digits only, so "+962 79 101 2345" and "0791012345" compare by the subscriber number. */
export const normalizePhone = (phone: string) => phone.replace(/\D/g, '').replace(/^(962|0)/, '');
