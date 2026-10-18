import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';

import { parseAsStringLiteral, useQueryState } from 'nuqs';

import { ClinicError, type Invoice, invoiceBalance, type PatientSummary, type Payment, type Visit } from '@api/clinic';
import { Alert, Avatar, Badge, Button, EmptyState, Money, Skeleton, Tabs, Tag } from '@components/ui';
import { DescriptionList, PageHeader, StatCard, Timeline, useGroupedByDay } from '@components/shared';

import { useAppTranslation, useDate } from '@hooks/shared';
import { FULL_ROUTES_PATH } from '@routes';

import { useDoctors, useInsurers, useInvoices, usePatient, usePatientVisits } from '../queries';
import { INVOICE_TONE, VISIT_TONE } from '../shared/status';
import { useClinicToday } from '../shared/useClinicToday';
import { useLocalized } from '../shared/useLocalized';
import EditPatientSheet from './EditPatientSheet';

const TABS = ['overview', 'timeline', 'invoices'] as const;
const TAB_PARAM = parseAsStringLiteral(TABS).withDefault('overview');
const NO_INVOICES: Invoice[] = [];
const NO_VISITS: Visit[] = [];

type TimelineEntry = { kind: 'visit'; at: string; visit: Visit } | { kind: 'payment'; at: string; payment: Payment; invoice: Invoice };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();

/** Whole years between a yyyy-MM-dd birth date and today's day key. */
const ageOn = (dob: string, todayKey: string) => {
  const [by, bm, bd] = dob.split('-').map(Number);
  const [ty, tm, td] = todayKey.split('-').map(Number);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
};

function Overview({ patient }: { patient: PatientSummary }) {
  const { t } = useAppTranslation('clinic');
  const { formatNullableDate, constants } = useDate();
  const localize = useLocalized();
  const doctors = useDoctors();
  const insurers = useInsurers();
  const insurer = insurers.data?.find((candidate) => candidate.id === patient.insurerId);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <DescriptionList
        layout="inline"
        items={[
          {
            term: t('profile.fields.dob'),
            value: <bdi>{formatNullableDate(patient.dob, constants.DateFormats.SHORT_MONTH_DAY_YEAR, '—')}</bdi>,
          },
          { term: t('profile.fields.sex'), value: t(`profile.sex.${patient.sex}`) },
          { term: t('profile.fields.email'), value: patient.email ? <bdi dir="ltr">{patient.email}</bdi> : '—' },
          { term: t('profile.fields.insurer'), value: insurer ? localize(insurer.name) : t('patients.selfPay') },
          { term: t('profile.fields.policy'), value: patient.policyNumber ?? '—', numeric: !!patient.policyNumber },
          { term: t('profile.fields.doctor'), value: localize(doctors.data?.find((d) => d.id === patient.primaryDoctorId)?.name) || '—' },
        ]}
      />
      <div className="flex flex-col gap-2">
        <h3 className="text-fg-muted text-sm">{t('profile.fields.allergies')}</h3>
        {patient.allergies.length ? (
          <div className="flex flex-wrap gap-2">
            {patient.allergies.map((allergy) => (
              <Tag key={allergy} tone="danger">
                {t(`profile.allergies.${allergy}`)}
              </Tag>
            ))}
          </div>
        ) : (
          <p className="text-fg text-sm">{t('profile.allergies.none')}</p>
        )}
      </div>
    </div>
  );
}

function PatientTimeline({ visits, invoices }: { visits: Visit[]; invoices: Invoice[] }) {
  const { t } = useAppTranslation('clinic');
  const { toDate, constants } = useDate();
  const localize = useLocalized();
  const doctors = useDoctors();

  const entries = useMemo<TimelineEntry[]>(
    () =>
      [
        ...visits
          .filter((visit) => visit.status !== 'cancelled')
          .map((visit): TimelineEntry => ({ kind: 'visit', at: visit.start, visit })),
        ...invoices.flatMap((invoice) =>
          invoice.payments.map((payment): TimelineEntry => ({ kind: 'payment', at: payment.date, payment, invoice })),
        ),
      ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)),
    [visits, invoices],
  );
  const groups = useGroupedByDay(entries, (entry) => entry.at);

  return (
    <Timeline empty={t('profile.timeline.empty')}>
      {groups.map((group) => (
        <Timeline.Group key={group.key} label={group.label}>
          {group.items.map((entry) =>
            entry.kind === 'visit' ? (
              <Timeline.Item
                key={entry.visit.id}
                tone={VISIT_TONE[entry.visit.status]}
                title={`${t(`schedule.types.${entry.visit.type}`)} · ${localize(doctors.data?.find((d) => d.id === entry.visit.doctorId)?.name)}`}
                meta={
                  <>
                    <bdi dir="ltr">{toDate(entry.visit.start, constants.TimeFormats.HOUR_MINUTES_12)}</bdi> ·{' '}
                    {t(`schedule.status.${entry.visit.status}`)}
                    {entry.visit.notes ? ` · ${entry.visit.notes}` : ''}
                  </>
                }
              />
            ) : (
              <Timeline.Item
                key={entry.payment.id}
                tone="success"
                title={t('profile.timeline.payment')}
                meta={
                  <>
                    <Money value={entry.payment.amount} tone="none" /> · {t(`methods.${entry.payment.method}`)} ·{' '}
                    <bdi dir="ltr">{entry.invoice.number}</bdi>
                  </>
                }
              />
            ),
          )}
        </Timeline.Group>
      ))}
    </Timeline>
  );
}

function PatientInvoices({ invoices }: { invoices: Invoice[] }) {
  const { t } = useAppTranslation('clinic');
  const { formatNullableDate, constants } = useDate();

  if (invoices.length === 0) return <p className="text-fg-muted text-sm">{t('profile.invoices.empty')}</p>;

  return (
    <ul className="divide-border-subtle border-border divide-y rounded-lg border">
      {invoices.map((invoice) => (
        <li key={invoice.id}>
          <Link
            to={`${FULL_ROUTES_PATH.BILLING.INDEX}?invoice=${invoice.id}`}
            className="hover:bg-hover focus-ring flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm"
          >
            <span dir="ltr" className="text-fg font-medium tabular-nums">
              {invoice.number}
            </span>
            <bdi className="text-fg-muted">{formatNullableDate(invoice.issuedAt, constants.DateFormats.SHORT_MONTH_DAY_YEAR, '—')}</bdi>
            <Badge tone={INVOICE_TONE[invoice.status]}>{t(`billing.status.${invoice.status}`)}</Badge>
            <Money value={invoiceBalance(invoice)} tone="none" className="ms-auto" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** One patient's record: who they are, what they owe, and everything that happened, with a way to book or edit. */
function PatientProfilePage() {
  const { id = '' } = useParams();
  const { t } = useAppTranslation('clinic');
  const { formatNullableDate, constants } = useDate();
  const localize = useLocalized();
  const { todayKey } = useClinicToday();
  const [tab, setTab] = useQueryState('tab', TAB_PARAM);
  const [editing, setEditing] = useState(false);
  const patient = usePatient(id);
  const visits = usePatientVisits(id);
  const invoices = useInvoices();
  const insurers = useInsurers();

  const patientVisits = visits.data ?? NO_VISITS;
  const patientInvoices = useMemo(
    () => (invoices.data ?? NO_INVOICES).filter((invoice) => invoice.patientId === id).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
    [invoices.data, id],
  );
  const visitsThisYear = useMemo(
    () => patientVisits.filter((visit) => visit.status === 'completed' && visit.start.slice(0, 4) === todayKey.slice(0, 4)).length,
    [patientVisits, todayKey],
  );

  const notFound = patient.error instanceof ClinicError && patient.error.code === 'not-found';

  if (notFound) {
    return (
      <EmptyState kind="no-results" title={t('profile.notFound.title')} description={t('profile.notFound.description')}>
        <EmptyState.Actions>
          <Button asChild variant="outline">
            <Link to={FULL_ROUTES_PATH.PATIENTS.INDEX}>{t('profile.backToPatients')}</Link>
          </Button>
        </EmptyState.Actions>
      </EmptyState>
    );
  }

  if (patient.isError || visits.isError || invoices.isError) {
    return (
      <Alert tone="danger">
        <Alert.Title>{t('profile.error.title')}</Alert.Title>
        <Alert.Description className="flex flex-wrap items-center gap-3">
          {t('profile.error.description')}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              for (const query of [patient, visits, invoices]) if (query.isError) void query.refetch();
            }}
          >
            {t('retry')}
          </Button>
        </Alert.Description>
      </Alert>
    );
  }

  const data = patient.data;

  if (!data) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton size="lg" className="w-64" />
        <Skeleton shape="block" size="lg" />
      </div>
    );
  }

  const name = localize(data.name);
  const insurer = insurers.data?.find((candidate) => candidate.id === data.insurerId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={FULL_ROUTES_PATH.PATIENTS.INDEX}
        title={name}
        media={<Avatar size="lg">{[<Avatar.Fallback key="initials">{initials(data.name.en)}</Avatar.Fallback>]}</Avatar>}
        meta={
          <span className="text-fg-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span dir="ltr" className="tabular-nums">
              {data.mrn}
            </span>
            <span>{t('profile.age', { count: ageOn(data.dob, todayKey) })}</span>
            <bdi dir="ltr" className="tabular-nums">
              {data.phone}
            </bdi>
            <Badge tone={insurer ? 'info' : 'neutral'}>{insurer ? localize(insurer.name) : t('patients.selfPay')}</Badge>
          </span>
        }
      >
        <PageHeader.Actions>
          <Button variant="outline" onClick={() => setEditing(true)}>
            {t('profile.edit')}
          </Button>
          <Button asChild>
            <Link to={`${FULL_ROUTES_PATH.SCHEDULE.INDEX}?patient=${data.id}&view=week`}>{t('profile.bookVisit')}</Link>
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('profile.stats.visitsThisYear')} value={visitsThisYear} loading={visits.isPending} />
        <StatCard label={t('profile.stats.balanceDue')} value={<Money value={data.balance} tone="none" />} />
        <StatCard
          label={t('profile.stats.lastVisit')}
          value={<bdi>{formatNullableDate(data.lastVisit, constants.DateFormats.SHORT_MONTH_DAY_YEAR, '—')}</bdi>}
        />
      </div>

      <Tabs value={tab} onValueChange={(value) => void setTab(value === 'overview' ? null : (value as (typeof TABS)[number]))}>
        <Tabs.List aria-label={t('profile.tabs.label')}>
          {TABS.map((value) => (
            <Tabs.Trigger key={value} value={value}>
              {t(`profile.tabs.${value}`)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="overview" className="pt-4">
          <Overview patient={data} />
        </Tabs.Content>
        <Tabs.Content value="timeline" className="pt-4">
          <PatientTimeline visits={patientVisits} invoices={patientInvoices} />
        </Tabs.Content>
        <Tabs.Content value="invoices" className="pt-4">
          <PatientInvoices invoices={patientInvoices} />
        </Tabs.Content>
      </Tabs>

      <EditPatientSheet patient={editing ? data : null} onClose={() => setEditing(false)} />
    </div>
  );
}

export default PatientProfilePage;
