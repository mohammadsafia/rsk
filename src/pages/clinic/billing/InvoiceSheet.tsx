import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { ClinicError, type Invoice, invoiceBalance, invoiceTotal, type PaymentMethod } from '@api/clinic';
import { Badge, Button, EmptyState, Money, Sheet, Skeleton } from '@components/ui';
import { ConfirmDialog } from '@components/shared';
import { FormContainer, FormDatePicker, FormNumber, FormSelect } from '@components/forms';

import { toast, useAppTranslation, useDate } from '@hooks/shared';

import { useMoneyFormat } from '@utils';

import { useInvoice, usePatients, useRecordPayment, useSendInvoice, useVoidInvoice } from '../queries';
import { INVOICE_TONE } from '../shared/status';
import { useClinicToday } from '../shared/useClinicToday';
import { useLocalized } from '../shared/useLocalized';

const METHODS: PaymentMethod[] = ['card', 'cash', 'insurance'];

type PaymentForm = { amount: number | null; method: PaymentMethod; date: string };

type Translate = ReturnType<typeof useAppTranslation>['t'];

/** Shows a store error in words: the code maps to copy, anything else is a generic failure. */
const errorToast = (t: Translate, error: unknown) =>
  toast({ title: t(`errors.${error instanceof ClinicError ? error.code : 'forced'}`), tone: 'danger' });

function RecordPayment({ invoice }: { invoice: Invoice }) {
  const { t } = useAppTranslation('clinic');
  const formatMoney = useMoneyFormat();
  const { todayKey } = useClinicToday();
  const record = useRecordPayment();
  const balance = invoiceBalance(invoice);

  const schema = useMemo(
    () =>
      z.object({
        amount: z
          .number({
            invalid_type_error: t('billing.sheet.record.amountRequired'),
            required_error: t('billing.sheet.record.amountRequired'),
          })
          .gt(0, t('billing.sheet.record.amountRequired'))
          .max(balance, t('billing.sheet.record.amountTooHigh', { balance: formatMoney(balance) })),
        method: z.enum(['card', 'cash', 'insurance']),
        date: z.string().min(1),
      }),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- formatMoney follows the language, which `t` tracks
    [balance, t],
  );

  const form = useForm<PaymentForm>({
    resolver: zodResolver(schema),
    defaultValues: { amount: null, method: 'card', date: todayKey },
  });

  return (
    <section aria-labelledby="record-payment" className="flex flex-col gap-3">
      <h3 id="record-payment" className="text-fg text-sm font-semibold">
        {t('billing.sheet.record.title')}
      </h3>
      <FormContainer
        formContext={form}
        className="grid gap-3 sm:grid-cols-3"
        onSuccess={(values) =>
          record.mutate(
            { id: invoice.id, payment: { amount: values.amount ?? 0, method: values.method, date: values.date } },
            {
              onSuccess: () => {
                toast({ title: t('billing.sheet.record.success'), tone: 'success' });
                form.reset({ amount: null, method: 'card', date: todayKey });
              },
              onError: (error) => errorToast(t, error),
            },
          )
        }
      >
        <FormNumber<PaymentForm> name="amount" control={form.control} label={t('billing.sheet.record.amount')} decimalScale={2} required />
        <FormSelect<PaymentForm, PaymentMethod>
          name="method"
          control={form.control}
          label={t('billing.sheet.record.method')}
          options={METHODS}
          getOptionLabel={(method) => t(`methods.${String(method)}`)}
          getOptionValue={(method) => String(method)}
        />
        <FormDatePicker<PaymentForm> name="date" control={form.control} label={t('billing.sheet.record.date')} />
        <div className="sm:col-span-3">
          <Button type="submit" loading={record.isLoading}>
            {t('billing.sheet.record.submit')}
          </Button>
        </div>
      </FormContainer>
    </section>
  );
}

function InvoiceBody({ invoice }: { invoice: Invoice }) {
  const { t } = useAppTranslation('clinic');
  const { formatNullableDate, constants } = useDate();
  const date = (value: string) => formatNullableDate(value, constants.DateFormats.SHORT_MONTH_DAY_YEAR, '—');

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="invoice-lines" className="flex flex-col gap-2">
        <h3 id="invoice-lines" className="text-fg text-sm font-semibold">
          {t('billing.sheet.lines')}
        </h3>
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-surface-sunken text-fg-muted text-xs">
              <tr>
                <th className="px-3 py-2 text-start font-medium">{t('billing.sheet.service')}</th>
                <th className="px-3 py-2 text-end font-medium">{t('billing.sheet.quantity')}</th>
                <th className="px-3 py-2 text-end font-medium">{t('billing.sheet.unitPrice')}</th>
                <th className="px-3 py-2 text-end font-medium">{t('billing.sheet.amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-border-subtle divide-y">
              {invoice.lines.map((line) => (
                <tr key={line.id}>
                  <td className="text-fg px-3 py-2">{t(`services.${line.service}`)}</td>
                  <td className="px-3 py-2 text-end tabular-nums">{line.quantity}</td>
                  <td className="px-3 py-2 text-end">
                    <Money value={line.unitPrice} tone="none" />
                  </td>
                  <td className="px-3 py-2 text-end">
                    <Money value={line.quantity * line.unitPrice} tone="none" />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-border border-t">
                <td colSpan={3} className="text-fg px-3 py-2 font-medium">
                  {t('billing.sheet.total')}
                </td>
                <td className="px-3 py-2 text-end font-medium">
                  <Money value={invoiceTotal(invoice)} tone="none" />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section aria-labelledby="invoice-payments" className="flex flex-col gap-2">
        <h3 id="invoice-payments" className="text-fg text-sm font-semibold">
          {t('billing.sheet.payments')}
        </h3>
        {invoice.payments.length === 0 ? (
          <p className="text-fg-muted text-sm">{t('billing.sheet.noPayments')}</p>
        ) : (
          <ul className="divide-border-subtle border-border divide-y rounded-lg border">
            {invoice.payments.map((payment) => (
              <li key={payment.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="text-fg-muted">
                  <bdi>{date(payment.date)}</bdi> · {t(`methods.${payment.method}`)}
                </span>
                <Money value={payment.amount} tone="none" />
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center justify-between px-3 text-sm font-medium">
          <span className="text-fg">{t('billing.sheet.balance')}</span>
          <Money value={invoiceBalance(invoice)} tone="none" />
        </div>
      </section>

      {invoice.status === 'sent' || invoice.status === 'overdue' ? <RecordPayment invoice={invoice} /> : null}
    </div>
  );
}

/** One invoice: its services, payments and balance, a payment form, and send / void actions. */
function InvoiceSheet({ invoiceId, onClose }: { invoiceId: string | null; onClose: () => void }) {
  const { t } = useAppTranslation('clinic');
  const { formatNullableDate, constants } = useDate();
  const localize = useLocalized();
  const invoice = useInvoice(invoiceId ?? '', { enabled: !!invoiceId });
  const patients = usePatients();
  const send = useSendInvoice();
  const voidInvoice = useVoidInvoice();
  // Keyed by invoice, so a different invoice never inherits an open void confirmation.
  const [confirmVoidFor, setConfirmVoidFor] = useState<string | null>(null);
  const confirmVoid = !!invoiceId && confirmVoidFor === invoiceId;

  const data = invoice.data;
  const patientName = localize(patients.data?.find((patient) => patient.id === data?.patientId)?.name);
  const date = (value: string) => formatNullableDate(value, constants.DateFormats.SHORT_MONTH_DAY_YEAR, '—');

  const description = data ? (
    <span className="flex flex-wrap items-center gap-2">
      {patientName}
      <span aria-hidden="true">·</span>
      <bdi>{t('billing.sheet.issuedDue', { issued: date(data.issuedAt), due: date(data.dueAt) })}</bdi>
      <Badge tone={INVOICE_TONE[data.status]}>{t(`billing.status.${data.status}`)}</Badge>
    </span>
  ) : undefined;

  return (
    <>
      <Sheet open={!!invoiceId} onOpenChange={(open) => !open && onClose()}>
        <Sheet.Content side="end" size="md" title={data?.number ?? t('billing.sheet.notFound')} description={description}>
          <Sheet.Body>
            {invoice.isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton />
                <Skeleton shape="block" size="lg" />
              </div>
            ) : !data ? (
              <EmptyState kind="no-results" title={t('billing.sheet.notFound')} description={t('billing.sheet.notFoundDescription')} />
            ) : (
              <InvoiceBody key={data.id} invoice={data} />
            )}
          </Sheet.Body>

          <Sheet.Footer>
            {data?.status === 'draft' ? (
              <Button
                variant="outline"
                loading={send.isLoading}
                onClick={() =>
                  send.mutate(data.id, {
                    onSuccess: () => toast({ title: t('billing.sheet.sent'), tone: 'success' }),
                    onError: (error) => errorToast(t, error),
                  })
                }
              >
                {t('billing.sheet.send')}
              </Button>
            ) : null}
            {data && data.status !== 'paid' && data.status !== 'void' ? (
              <Button variant="outline" tone="danger" onClick={() => setConfirmVoidFor(invoiceId)}>
                {t('billing.sheet.void')}
              </Button>
            ) : null}
            <Sheet.Close asChild>
              <Button variant="ghost" className="ms-auto">
                {t('billing.sheet.close')}
              </Button>
            </Sheet.Close>
          </Sheet.Footer>
        </Sheet.Content>
      </Sheet>

      <ConfirmDialog
        open={confirmVoid}
        onOpenChange={(open) => setConfirmVoidFor(open ? invoiceId : null)}
        tone="danger"
        title={t('billing.sheet.voidTitle', { number: data?.number ?? '' })}
        description={t('billing.sheet.voidDescription')}
        confirmLabel={t('billing.sheet.void')}
        onConfirm={() => {
          if (!data) return;
          voidInvoice.mutate(data.id, {
            onSuccess: () => toast({ title: t('billing.sheet.voided'), tone: 'success' }),
            onError: (error) => errorToast(t, error),
          });
        }}
      >
        {null}
      </ConfirmDialog>
    </>
  );
}

export default InvoiceSheet;
