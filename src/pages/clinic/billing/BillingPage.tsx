import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  type ColumnDef,
  type FilterFn,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
  useReactTable,
} from '@tanstack/react-table';
import { parseAsString, useQueryState } from 'nuqs';

import { type InvoiceStatus } from '@api/clinic';
import { Alert, Badge, Button, EmptyState, Money, Tabs } from '@components/ui';
import { ConfirmDialog, PageHeader, StatCard } from '@components/shared';
import { createSelectionColumn, DataTable } from '@components/tables';

import { toast, useAppTranslation, useDate } from '@hooks/shared';
import { patientPath } from '@routes';

import { CheckCheck, Download, Send } from 'lucide-react';

import { useBulkInvoices, useInvoices, usePatients } from '../queries';
import { INVOICE_TONE } from '../shared/status';
import { useClinicToday } from '../shared/useClinicToday';
import { useLocalized } from '../shared/useLocalized';
import { billingSummary, downloadCsv, type InvoiceRow, invoicesToCsv, toInvoiceRows } from './billing';
import InvoiceSheet from './InvoiceSheet';

const STATUSES: InvoiceStatus[] = ['draft', 'sent', 'overdue', 'paid', 'void'];
const ALL = 'all';
const NO_ROWS: InvoiceRow[] = [];

/** Search covers what people type here: the invoice number and the patient's name. */
const SEARCHABLE = new Set(['number', 'patient']);

const searchInvoices: FilterFn<InvoiceRow> = (row, columnId, filterValue) =>
  String(row.getValue(columnId) ?? '')
    .toLowerCase()
    .includes(
      String(filterValue ?? '')
        .trim()
        .toLowerCase(),
    );

/** Invoices, payments and what is still owed: status tabs, bulk reminders / mark paid / CSV, and an invoice Sheet. */
function BillingPage() {
  const { t, i18n } = useAppTranslation('clinic');
  const { formatNullableDate, constants } = useDate();
  const localize = useLocalized();
  const { todayKey } = useClinicToday();
  const invoices = useInvoices();
  const patients = usePatients();
  const bulk = useBulkInvoices();
  const [status, setStatus] = useQueryState('status', parseAsString.withDefault(ALL));
  const [invoiceId, setInvoiceId] = useQueryState('invoice', parseAsString);
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);

  const rows = useMemo(
    () => (invoices.data && patients.data ? toInvoiceRows(invoices.data, patients.data, localize) : NO_ROWS),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- localize follows the language
    [invoices.data, patients.data, i18n.language],
  );
  const summary = useMemo(() => billingSummary(invoices.data ?? [], todayKey), [invoices.data, todayKey]);
  const counts = useMemo(
    () => Object.fromEntries(STATUSES.map((value) => [value, rows.filter((row) => row.status === value).length])),
    [rows],
  );

  const date = (value: string) => formatNullableDate(value, constants.DateFormats.SHORT_MONTH_DAY_YEAR, '—');
  const statusLabel = (value: InvoiceStatus) => t(`billing.status.${value}`);

  const columns = useMemo<ColumnDef<InvoiceRow>[]>(
    () => [
      createSelectionColumn<InvoiceRow>({ getRowLabel: (row) => row.number }),
      {
        accessorKey: 'number',
        header: t('billing.columns.number'),
        cell: ({ row }) => (
          <span dir="ltr" className="text-fg font-medium tabular-nums">
            {row.original.number}
          </span>
        ),
        meta: { label: t('billing.columns.number') },
      },
      {
        id: 'patient',
        accessorFn: (row) => row.patientName,
        header: t('billing.columns.patient'),
        cell: ({ row }) => (
          <Link to={patientPath(row.original.patientId)} className="text-fg focus-ring rounded-sm hover:underline">
            {row.original.patientName}
          </Link>
        ),
        meta: { label: t('billing.columns.patient') },
      },
      {
        accessorKey: 'issuedAt',
        header: t('billing.columns.issued'),
        sortDescFirst: true,
        cell: ({ row }) => <bdi className="text-fg-muted">{date(row.original.issuedAt)}</bdi>,
        meta: { label: t('billing.columns.issued') },
      },
      {
        accessorKey: 'dueAt',
        header: t('billing.columns.due'),
        cell: ({ row }) => <bdi className="text-fg-muted">{date(row.original.dueAt)}</bdi>,
        meta: { label: t('billing.columns.due') },
      },
      {
        accessorKey: 'status',
        header: t('billing.columns.status'),
        enableSorting: false,
        filterFn: 'equals',
        cell: ({ row }) => <Badge tone={INVOICE_TONE[row.original.status]}>{statusLabel(row.original.status)}</Badge>,
        meta: { label: t('billing.columns.status') },
      },
      {
        accessorKey: 'total',
        header: t('billing.columns.total'),
        cell: ({ row }) => <Money value={row.original.total} tone="none" />,
        meta: { label: t('billing.columns.total'), numeric: true },
      },
      {
        accessorKey: 'balance',
        header: t('billing.columns.balance'),
        cell: ({ row }) => <Money value={row.original.balance} tone="none" />,
        meta: { label: t('billing.columns.balance'), numeric: true },
      },
    ],
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- date/statusLabel follow the language, which `t` tracks
    [t],
  );

  const [globalFilter, setGlobalFilter] = useState('');
  // Stable between renders: a new array each render reads as a filter change, which auto-resets paging,
  // which renders again — an endless loop once a row is selected.
  const columnFilters = useMemo(() => (status === ALL ? [] : [{ id: 'status', value: status }]), [status]);

  const table = useReactTable<InvoiceRow>({
    data: rows,
    columns,
    state: { globalFilter, columnFilters },
    onGlobalFilterChange: setGlobalFilter,
    enableGlobalFilter: true,
    globalFilterFn: searchInvoices,
    getColumnCanGlobalFilter: (column) => SEARCHABLE.has(column.id),
    getRowId: (row) => row.id,
    initialState: { pagination: { pageSize: 10 }, sorting: [{ id: 'issuedAt', desc: true }] },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // A new tab starts on its first page.
  useEffect(() => table.setPageIndex(0), [status, table]);

  const report = (key: 'reminded' | 'markedPaid', done: number, skipped: number) =>
    toast({ title: `${t(`billing.bulk.${key}`, { done })}${skipped ? t('billing.bulk.skipped', { skipped }) : ''}` });

  const runBulk = (ids: string[], action: 'mark-paid' | 'send-reminder') =>
    bulk.mutate(
      { ids, action },
      {
        onSuccess: (result) => {
          report(action === 'mark-paid' ? 'markedPaid' : 'reminded', result.done.length, result.skipped.length);
          table.resetRowSelection();
        },
        onError: () => toast({ title: t('billing.bulk.failed'), tone: 'danger' }),
      },
    );

  const exportRows = (selected: Row<InvoiceRow>[]) =>
    downloadCsv(
      `invoices-${todayKey}.csv`,
      invoicesToCsv(
        selected.map((row) => row.original),
        {
          number: t('billing.columns.number'),
          patient: t('billing.columns.patient'),
          issued: t('billing.columns.issued'),
          due: t('billing.columns.due'),
          status: t('billing.columns.status'),
          total: t('billing.columns.total'),
          balance: t('billing.columns.balance'),
        },
        statusLabel,
      ),
    );

  const failed = invoices.isError || patients.isError;
  const loading = invoices.isLoading || patients.isLoading;

  const content = () => {
    if (failed) {
      return (
        <Alert tone="danger">
          <Alert.Title>{t('billing.error.title')}</Alert.Title>
          <Alert.Description className="flex flex-wrap items-center gap-3">
            {t('billing.error.description')}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                for (const query of [invoices, patients]) if (query.isError) void query.refetch();
              }}
            >
              {t('retry')}
            </Button>
          </Alert.Description>
        </Alert>
      );
    }

    return (
      <>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label={t('billing.summary.outstanding')} value={<Money value={summary.outstanding} tone="none" />} loading={loading} />
          <StatCard
            label={t('billing.summary.overdue')}
            value={<Money value={summary.overdue} tone="none" />}
            caption={t('billing.summary.overdueCaption', { count: summary.overdueCount })}
            loading={loading}
          />
          <StatCard
            label={t('billing.summary.collected')}
            value={<Money value={summary.collectedThisMonth} tone="none" />}
            loading={loading}
          />
        </div>

        {!loading && rows.length === 0 ? (
          <EmptyState kind="first-use" title={t('billing.empty.title')} description={t('billing.empty.description')} />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <Tabs value={status} onValueChange={(value) => void setStatus(value === ALL ? null : value)}>
              <Tabs.List aria-label={t('billing.tabs.label')} className="overflow-x-auto">
                <Tabs.Trigger value={ALL}>
                  {t('billing.tabs.all')} <span className="text-fg-muted tabular-nums">{rows.length}</span>
                </Tabs.Trigger>
                {STATUSES.map((value) => (
                  <Tabs.Trigger key={value} value={value}>
                    {statusLabel(value)} <span className="text-fg-muted tabular-nums">{counts[value]}</span>
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </Tabs>

            <DataTable
              table={table}
              isLoading={loading}
              onRowClick={(row) => void setInvoiceId(row.original.id)}
              className="min-h-0 flex-1"
            >
              <DataTable.Toolbar
                totalCount={table.getFilteredRowModel().rows.length}
                totalLabel={t('billing.totalLabel')}
                placeholder={t('billing.searchPlaceholder')}
              />

              <DataTable.BulkActions<InvoiceRow>>
                {(selected, ids) => (
                  <>
                    <Button size="sm" variant="outline" loading={bulk.isLoading} onClick={() => runBulk(ids, 'send-reminder')}>
                      <Send aria-hidden="true" />
                      {t('billing.bulk.remind')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmIds(ids)}>
                      <CheckCheck aria-hidden="true" />
                      {t('billing.bulk.markPaid')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => exportRows(selected)}>
                      <Download aria-hidden="true" />
                      {t('billing.bulk.export')}
                    </Button>
                  </>
                )}
              </DataTable.BulkActions>

              <DataTable.Content emptyState={{ title: t('billing.noResults.title'), description: t('billing.noResults.description') }} />

              <DataTable.Pagination />
            </DataTable>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <PageHeader title={t('billing.title')} description={t('billing.description')} />

      {content()}

      <ConfirmDialog
        open={!!confirmIds}
        onOpenChange={(open) => !open && setConfirmIds(null)}
        title={t('billing.bulk.confirmTitle', { count: confirmIds?.length ?? 0 })}
        description={t('billing.bulk.confirmDescription')}
        confirmLabel={t('billing.bulk.markPaid')}
        onConfirm={() => {
          if (confirmIds) runBulk(confirmIds, 'mark-paid');
          setConfirmIds(null);
        }}
      >
        {null}
      </ConfirmDialog>

      <InvoiceSheet invoiceId={invoiceId} onClose={() => void setInvoiceId(null)} />
    </div>
  );
}

export default BillingPage;
