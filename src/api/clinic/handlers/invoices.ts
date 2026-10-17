import { clinicService } from '../service';
import type { PaymentMethod } from '../types';

export type PaymentInput = { amount: number; method: PaymentMethod; date: string };
export type BulkInvoiceAction = 'mark-paid' | 'send-reminder';

export const InvoicesHandler = {
  list: { queryKey: 'clinic/invoices/list', request: () => clinicService.listInvoices() },
  get: { queryKey: 'clinic/invoices/get', request: (id: string) => clinicService.getInvoice(id) },
  recordPayment: { request: (id: string, payment: PaymentInput) => clinicService.recordPayment(id, payment) },
  send: { request: (id: string) => clinicService.sendInvoice(id) },
  void: { request: (id: string) => clinicService.voidInvoice(id) },
  bulk: { request: (ids: string[], action: BulkInvoiceAction) => clinicService.bulkInvoices(ids, action) },
} as const;
