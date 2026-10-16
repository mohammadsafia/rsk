import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  type ColumnDef,
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

type Option = { id: string; name: string };

type ColumnsInput = {
  t: ReturnType<typeof useAppTranslation>['t'];
  localize: ReturnType<typeof useLocalized>;
  formatVisit: (iso: string | null) => string;
  doctors: Doctor[];
  insurers: Insurer[];
};

const optionFilter = (label: string, options: Option[]) =>
  createFilterMeta({
    variant: 'multiSelect',
    label,
    options,
    getOptionLabel: (option: Option) => option.name,
    getOptionValue: (option: Option) => option.id,
  });

const buildColumns = ({ t, localize, formatVisit, doctors, insurers }: ColumnsInput): ColumnDef<PatientSummary>[] => {
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
      filterFn: containsFilterFn,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-fg font-medium">{localize(row.original.name)}</span>
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
      enableHiding: true,
      cell: () => null,
      meta: { label: t('patients.columns.mrn') },
    },
    {
      accessorKey: 'phone',
      header: t('patients.columns.phone'),
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
      filterFn: inListFilterFn,
      cell: ({ row }) => <span className="text-fg">{doctorName(row.original.primaryDoctorId)}</span>,
      meta: { label: t('patients.columns.doctor'), filterMeta: optionFilter(t('patients.columns.doctor'), doctorOptions) },
    },
    {
      id: 'insurer',
      accessorFn: (patient) => patient.insurerId ?? SELF_PAY,
      header: t('patients.columns.insurer'),
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
        <span dir="ltr" className="text-fg-muted tabular-nums">
          {formatVisit(row.original.lastVisit)}
        </span>
      ),
      meta: {
        label: t('patients.columns.lastVisit'),
        filterMeta: createFilterMeta({ variant: 'dateRange', label: t('patients.columns.lastVisit') }),
      },
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
  const { t } = useAppTranslation('clinic');
  const navigate = useNavigate();
  const localize = useLocalized();
  const { formatNullableDate, constants } = useDate();
  const patients = usePatients();
  const doctors = useDoctors();
  const insurers = useInsurers();

  const formatVisit = (iso: string | null) => formatNullableDate(iso, constants.DateFormats.SHORT_MONTH_DAY_YEAR, '—');

  const columns = useMemo(
    () => buildColumns({ t, localize, formatVisit, doctors: doctors.data ?? [], insurers: insurers.data ?? [] }),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- localize/formatVisit follow the language, which `t` already tracks
    [t, doctors.data, insurers.data],
  );
  const filters = useDataTableFilters({ columns, urlSync: true, storageKey: 'clinic-patients' });

  const table = useReactTable<PatientSummary>({
    data: patients.data ?? [],
    columns,
    state: { ...filters.state, columnVisibility: { mrn: false } },
    onColumnFiltersChange: filters.onColumnFiltersChange,
    onGlobalFilterChange: filters.onGlobalFilterChange,
    enableGlobalFilter: true,
    globalFilterFn: 'includesString',
    getColumnCanGlobalFilter: () => true,
    enableSortingRemoval: true,
    initialState: { pagination: { pageSize: 10 } },
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
    if (patients.isError) {
      return (
        <Alert tone="danger">
          <Alert.Title>{t('patients.error.title')}</Alert.Title>
          <Alert.Description className="flex flex-wrap items-center gap-3">
            {t('patients.error.description')}
            <Button size="sm" variant="outline" onClick={() => void patients.refetch()}>
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
        isLoading={patients.isLoading}
        onResetFilters={filters.reset}
        onRowClick={(row) => navigate(patientPath(row.original.id))}
        getRowClassName={() => 'cursor-pointer'}
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
