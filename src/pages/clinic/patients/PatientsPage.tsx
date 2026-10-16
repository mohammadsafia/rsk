import { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import {
  type ColumnDef,
  type FilterFn,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import type { Doctor, Insurer, PatientSummary } from '@api/clinic';
import { Alert, Button, EmptyState, Money } from '@components/ui';
import { PageHeader } from '@components/shared';
import { DataTable } from '@components/tables';

import { useAppTranslation, useDataTableFilters, useDate } from '@hooks/shared';
import { FULL_ROUTES_PATH, patientPath } from '@routes';

import { containsFilterFn, createFilterMeta, dateRangeFilterFn, inListFilterFn } from '@utils';

import { Plus } from 'lucide-react';

import { useDoctors, useInsurers, usePatients } from '../queries';
import { useLocalized } from '../shared/useLocalized';

const SELF_PAY = 'self-pay';

/** Search covers what people type: names, MRNs and phones (not doctor or insurer ids, dates or balances). */
const SEARCHABLE = new Set(['name', 'mrn', 'phone']);

const digits = (value: string) => value.replace(/\D/g, '').replace(/^(962|0)/, '');

const searchPatients: FilterFn<PatientSummary> = (row, columnId, filterValue) => {
  const query = String(filterValue ?? '')
    .trim()
    .toLowerCase();
  if (!query) return true;
  const value = String(row.getValue(columnId) ?? '').toLowerCase();
  if (value.includes(query)) return true;
  // "0791012345" finds "+962 79 101 2345".
  const queryDigits = digits(query);
  return columnId === 'phone' && queryDigits.length >= 3 && digits(value).includes(queryDigits);
};

type Option = { id: string; name: string };

type ColumnsInput = {
  t: ReturnType<typeof useAppTranslation>['t'];
  localize: ReturnType<typeof useLocalized>;
  formatVisit: (iso: string | null) => string;
  doctors: Doctor[];
  insurers: Insurer[];
  language: string;
};

const optionFilter = (label: string, options: Option[]) =>
  createFilterMeta({
    variant: 'multiSelect',
    label,
    options,
    getOptionLabel: (option: Option) => option.name,
    getOptionValue: (option: Option) => option.id,
  });

const buildColumns = ({ t, localize, formatVisit, doctors, insurers, language }: ColumnsInput): ColumnDef<PatientSummary>[] => {
  const doctorName = (id: string) => localize(doctors.find((doctor) => doctor.id === id)?.name) || '—';
  const insurerName = (id: string | null) =>
    id ? localize(insurers.find((insurer) => insurer.id === id)?.name) || '—' : t('patients.selfPay');
  const doctorOptions = doctors.map((doctor) => ({ id: doctor.id, name: localize(doctor.name) }));
  const insurerOptions = [
    ...insurers.map((insurer) => ({ id: insurer.id, name: localize(insurer.name) })),
    { id: SELF_PAY, name: t('patients.selfPay') },
  ];

  return [
    {
      id: 'name',
      accessorFn: (patient) => localize(patient.name),
      header: t('patients.columns.name'),
      enableSorting: true,
      // Alphabetical in the active language (Arabic names sort as Arabic, not by code point).
      sortingFn: (a, b) => String(a.getValue('name')).localeCompare(String(b.getValue('name')), language),
      filterFn: containsFilterFn,
      cell: ({ row }) => (
        <div className="flex flex-col">
          {/* A real link, so keyboard and screen-reader users can open the profile (the row click is a mouse shortcut). */}
          <Link to={patientPath(row.original.id)} className="text-fg focus-ring w-fit rounded-sm font-medium hover:underline">
            {localize(row.original.name)}
          </Link>
          <span dir="ltr" className="text-fg-muted text-xs tabular-nums">
            {row.original.mrn}
          </span>
        </div>
      ),
      meta: { label: t('patients.columns.name') },
    },
    {
      accessorKey: 'mrn',
      header: t('patients.columns.mrn'),
      cell: () => null,
      meta: { label: t('patients.columns.mrn') },
      enableSorting: false,
    },
    {
      accessorKey: 'phone',
      header: t('patients.columns.phone'),
      enableSorting: false,
      cell: ({ row }) => (
        <bdi dir="ltr" className="text-fg-muted tabular-nums">
          {row.original.phone}
        </bdi>
      ),
      meta: { label: t('patients.columns.phone') },
    },
    {
      accessorKey: 'primaryDoctorId',
      header: t('patients.columns.doctor'),
      sortingFn: (a, b) => doctorName(a.original.primaryDoctorId).localeCompare(doctorName(b.original.primaryDoctorId), language),
      filterFn: inListFilterFn,
      cell: ({ row }) => <span className="text-fg">{doctorName(row.original.primaryDoctorId)}</span>,
      meta: { label: t('patients.columns.doctor'), filterMeta: optionFilter(t('patients.columns.doctor'), doctorOptions) },
    },
    {
      id: 'insurer',
      accessorFn: (patient) => patient.insurerId ?? SELF_PAY,
      header: t('patients.columns.insurer'),
      sortingFn: (a, b) => insurerName(a.original.insurerId).localeCompare(insurerName(b.original.insurerId), language),
      filterFn: inListFilterFn,
      cell: ({ row }) => <span className="text-fg-muted">{insurerName(row.original.insurerId)}</span>,
      meta: { label: t('patients.columns.insurer'), filterMeta: optionFilter(t('patients.columns.insurer'), insurerOptions) },
    },
    {
      id: 'lastVisit',
      accessorFn: (patient) => patient.lastVisit?.slice(0, 10) ?? '',
      header: t('patients.columns.lastVisit'),
      enableSorting: true,
      sortDescFirst: true,
      filterFn: dateRangeFilterFn,
      cell: ({ row }) => (
        // Isolated, not forced LTR: Arabic dates carry Arabic month names.
        <bdi data-slot="last-visit" className="text-fg-muted tabular-nums">
          {formatVisit(row.original.lastVisit)}
        </bdi>
      ),
      meta: {
        label: t('patients.columns.lastVisit'),
        filterMeta: createFilterMeta({ variant: 'dateRange', label: t('patients.columns.lastVisit') }),
      },
    },
    {
      id: 'createdAt',
      accessorFn: (patient) => patient.createdAt.slice(0, 10),
      header: t('patients.columns.registered'),
      enableSorting: true,
      sortDescFirst: true,
      cell: ({ row }) => <bdi className="text-fg-muted tabular-nums">{formatVisit(row.original.createdAt)}</bdi>,
      meta: { label: t('patients.columns.registered') },
    },
    {
      accessorKey: 'balance',
      header: t('patients.columns.balance'),
      enableSorting: true,
      sortDescFirst: true,
      cell: ({ row }) => <Money value={row.original.balance} tone="none" />,
      meta: { label: t('patients.columns.balance'), numeric: true },
    },
  ];
};

/** Everyone registered at the clinic: search, filter by doctor, insurer and last visit; a row opens the profile. */
function PatientsPage() {
  const { t, i18n } = useAppTranslation('clinic');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // `?sort=created` (from the dashboard's New patients card) lists the newest registrations first.
  const initialSorting = searchParams.get('sort') === 'created' ? [{ id: 'createdAt', desc: true }] : [{ id: 'name', desc: false }];
  const localize = useLocalized();
  const { formatNullableDate, constants } = useDate();
  const patients = usePatients();
  const doctors = useDoctors();
  const insurers = useInsurers();

  const formatVisit = (iso: string | null) => formatNullableDate(iso, constants.DateFormats.SHORT_MONTH_DAY_YEAR, '—');

  const columns = useMemo(
    () => buildColumns({ t, localize, formatVisit, doctors: doctors.data ?? [], insurers: insurers.data ?? [], language: i18n.language }),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- localize/formatVisit follow the language, which `t` already tracks
    [t, i18n.language, doctors.data, insurers.data],
  );
  const filters = useDataTableFilters({ columns, urlSync: true, storageKey: 'clinic-patients' });

  const table = useReactTable<PatientSummary>({
    data: patients.data ?? [],
    columns,
    state: { ...filters.state, columnVisibility: { mrn: false } },
    onColumnFiltersChange: filters.onColumnFiltersChange,
    onGlobalFilterChange: filters.onGlobalFilterChange,
    enableGlobalFilter: true,
    globalFilterFn: searchPatients,
    getColumnCanGlobalFilter: (column) => SEARCHABLE.has(column.id),
    enableSortingRemoval: true,
    initialState: { pagination: { pageSize: 10 }, sorting: initialSorting },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const newPatientLink = (
    <Button asChild>
      <Link to={FULL_ROUTES_PATH.PATIENTS.NEW}>
        <Plus aria-hidden="true" />
        {t('patients.newPatient')}
      </Link>
    </Button>
  );

  const body = () => {
    if (patients.isError || doctors.isError || insurers.isError) {
      return (
        <Alert tone="danger">
          <Alert.Title>{t('patients.error.title')}</Alert.Title>
          <Alert.Description className="flex flex-wrap items-center gap-3">
            {t('patients.error.description')}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                for (const query of [patients, doctors, insurers]) if (query.isError) void query.refetch();
              }}
            >
              {t('retry')}
            </Button>
          </Alert.Description>
        </Alert>
      );
    }

    if (patients.isSuccess && patients.data.length === 0) {
      return (
        <EmptyState kind="first-use" title={t('patients.empty.title')} description={t('patients.empty.description')}>
          <EmptyState.Actions>{newPatientLink}</EmptyState.Actions>
        </EmptyState>
      );
    }

    return (
      <DataTable
        table={table}
        isLoading={patients.isLoading || doctors.isLoading || insurers.isLoading}
        onResetFilters={filters.reset}
        onRowClick={(row) => navigate(patientPath(row.original.id))}
        className="min-h-0 flex-1"
      >
        <DataTable.Toolbar
          totalCount={table.getFilteredRowModel().rows.length}
          totalLabel={t('patients.totalLabel')}
          placeholder={t('patients.searchPlaceholder')}
        />

        <DataTable.Content emptyState={{ title: t('patients.noResults.title'), description: t('patients.noResults.description') }} />

        <DataTable.Pagination />
      </DataTable>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader title={t('patients.title')} description={t('patients.description')}>
        <PageHeader.Actions>{newPatientLink}</PageHeader.Actions>
      </PageHeader>

      {body()}
    </div>
  );
}

export default PatientsPage;
