import { z } from 'zod';

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Record-payment rules: an amount above 0 and at most the balance, a method, and a date that isn't in the future. */
export const paymentSchema = ({
  t,
  balance,
  balanceLabel,
  todayKey,
}: {
  t: Translate;
  balance: number;
  balanceLabel: string;
  todayKey: string;
}) =>
  z.object({
    amount: z
      .number({ invalid_type_error: t('billing.sheet.record.amountRequired'), required_error: t('billing.sheet.record.amountRequired') })
      .gt(0, t('billing.sheet.record.amountRequired'))
      .max(balance, t('billing.sheet.record.amountTooHigh', { balance: balanceLabel })),
    method: z.enum(['card', 'cash', 'insurance']),
    date: z
      .string({ required_error: t('billing.sheet.record.dateRequired'), invalid_type_error: t('billing.sheet.record.dateRequired') })
      .min(1, t('billing.sheet.record.dateRequired'))
      .refine((date) => date <= todayKey, t('billing.sheet.record.dateFuture')),
  });
