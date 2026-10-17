import type { InvoiceStatus, VisitStatus } from '@api/clinic';

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export const VISIT_TONE: Record<VisitStatus, Tone> = {
  scheduled: 'info',
  arrived: 'accent',
  completed: 'success',
  'no-show': 'warning',
  cancelled: 'neutral',
};

export const INVOICE_TONE: Record<InvoiceStatus, Tone> = {
  draft: 'neutral',
  sent: 'info',
  overdue: 'danger',
  paid: 'success',
  void: 'neutral',
};
