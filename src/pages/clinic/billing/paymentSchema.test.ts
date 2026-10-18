// src/pages/clinic/billing/paymentSchema.test.ts
import { describe, expect, it } from 'vite-plus/test';

import { paymentSchema } from './paymentSchema';

const schema = paymentSchema({ t: (key) => key, balance: 100, balanceLabel: '100', todayKey: '2026-10-18' });
const messageFor = (input: unknown, path: string) =>
  schema.safeParse(input).error?.issues.find((issue) => issue.path.join('.') === path)?.message;

describe('payment messages users read', () => {
  it('says the amount is required when it is missing or not a number', () => {
    expect(messageFor({ method: 'cash', date: '2026-10-18' }, 'amount')).toBe('billing.sheet.record.amountRequired');
    expect(messageFor({ amount: 'abc', method: 'cash', date: '2026-10-18' }, 'amount')).toBe('billing.sheet.record.amountRequired');
  });

  it('says the date is required when it is missing, and not in the future otherwise', () => {
    expect(messageFor({ amount: 5, method: 'cash' }, 'date')).toBe('billing.sheet.record.dateRequired');
    expect(messageFor({ amount: 5, method: 'cash', date: '2026-10-19' }, 'date')).toBe('billing.sheet.record.dateFuture');
  });
});
