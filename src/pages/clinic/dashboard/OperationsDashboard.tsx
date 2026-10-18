import { type ReactNode, useId, useMemo } from 'react';
import { Link } from 'react-router';

import { parseAsInteger, useQueryState } from 'nuqs';

import type { DailyMetric } from '@api/clinic';
import { AreaChart, BarChart, DonutChart, Sparkline } from '@components/charts';
import { Alert, Button, Card, Money, Select } from '@components/ui';
import { PageHeader, StatCard, Timeline } from '@components/shared';

import { useAppTranslation, useDate } from '@hooks/shared';
import { patientPath } from '@routes';

import { useNumberFormat } from '@utils';

import { useDoctors, useMetrics, usePatients, useVisits } from '../queries';
import { useClinicToday } from '../shared/useClinicToday';
import { useLocalized } from '../shared/useLocalized';
import { VISIT_TONE } from '../shared/status';
import { payerMix, type RangeDays, revenueByDoctor, summarize, visitsSeries } from './metrics';

const RANGES: RangeDays[] = [7, 30, 90];
const MAX_TODAY = 6;
const NO_METRICS: DailyMetric[] = [];

const toRange = (value: number): RangeDays => (RANGES.includes(value as RangeDays) ? (value as RangeDays) : 30);

function Panel({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={className}>
      <Card className="h-full">
        <Card.Header>
          <Card.Title id={id}>{title}</Card.Title>
        </Card.Header>
        <Card.Content>{children}</Card.Content>
      </Card>
    </section>
  );
}

function TodayPanel() {
  const { t } = useAppTranslation('clinic');
  const { toDate, constants } = useDate();
  const localize = useLocalized();
  const { todayKey, now } = useClinicToday();
  const visits = useVisits({ from: todayKey, to: todayKey });
  const patients = usePatients();
  const doctors = useDoctors();

  const upcoming = useMemo(
    () =>
      (visits.data ?? [])
        .filter((visit) => (visit.status === 'scheduled' || visit.status === 'arrived') && Date.parse(visit.end) > now.getTime())
        .sort((a, b) => Date.parse(a.start) - Date.parse(b.start)),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- `now` is read once per render on purpose
    [visits.data],
  );

  const failed = visits.isError || patients.isError || doctors.isError;

  return (
    <Panel title={t('dashboard.today.title')}>
      {failed ? (
        <Alert tone="danger">
          <Alert.Description className="flex flex-wrap items-center gap-3">
            {t('dashboard.today.error')}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                for (const query of [visits, patients, doctors]) if (query.isError) void query.refetch();
              }}
            >
              {t('retry')}
            </Button>
          </Alert.Description>
        </Alert>
      ) : (
        <div className="flex flex-col gap-3">
          <Timeline loading={visits.isPending || patients.isPending} empty={t('dashboard.today.empty')}>
            {upcoming.slice(0, MAX_TODAY).map((visit) => {
              const patient = patients.data?.find((p) => p.id === visit.patientId);
              const doctor = doctors.data?.find((d) => d.id === visit.doctorId);
              return (
                <Timeline.Item
                  key={visit.id}
                  tone={VISIT_TONE[visit.status]}
                  title={
                    <Link to={patientPath(visit.patientId)} className="focus-ring rounded-sm hover:underline">
                      {localize(patient?.name)}
                    </Link>
                  }
                  meta={
                    <>
                      {localize(doctor?.name)} · <bdi dir="ltr">{toDate(visit.start, constants.TimeFormats.HOUR_MINUTES_12)}</bdi>
                    </>
                  }
                />
              );
            })}
          </Timeline>
          {upcoming.length > MAX_TODAY ? (
            <Link to="/schedule" className="text-accent focus-ring w-fit rounded-sm text-sm font-medium hover:underline">
              {t('dashboard.today.viewSchedule')}
            </Link>
          ) : null}
        </div>
      )}
    </Panel>
  );
}

/** The clinic at a glance: four headline figures with trends, three charts and the rest of today's visits. */
function OperationsDashboard() {
  const { t } = useAppTranslation('clinic');
  const { formatDate, constants } = useDate();
  const formatNumber = useNumberFormat();
  const localize = useLocalized();
  const [rawRange, setRange] = useQueryState('range', parseAsInteger.withDefault(30));
  const range = toRange(rawRange);
  const metrics = useMetrics(90);
  const doctors = useDoctors();

  const data = metrics.data ?? NO_METRICS;
  const figures = useMemo(() => summarize(data, range), [data, range]);
  const series = useMemo(() => visitsSeries(data, range), [data, range]);
  const byDoctor = useMemo(
    () => revenueByDoctor(data, range).map((row) => ({ ...row, doctor: localize(doctors.data?.find((d) => d.id === row.doctorId)?.name) })),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- localize follows the language, which `t` tracks
    [data, range, doctors.data, t],
  );
  const mix = useMemo(() => {
    const totals = payerMix(data, range);
    return [
      { name: t('dashboard.charts.insured'), value: totals.insured },
      { name: t('dashboard.charts.selfPay'), value: totals.selfPay },
    ];
  }, [data, range, t]);

  const loading = metrics.isPending;
  const trend = (value: number | null, positive: 'up' | 'down' = 'up') => (value === null ? undefined : { value, positive });
  // Say what a trend compares with; no trend (90 days) means no caption either.
  const caption = (value: number | null) => (value === null ? undefined : t('dashboard.vsPrevious', { days: range }));
  const shortDate = (value: unknown) =>
    formatDate(String(value), constants.DateFormats.DAY_OF_MONTH) + ' ' + formatDate(String(value), constants.DateFormats.SHORT_MONTH);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('dashboard.title')} description={t('dashboard.description')}>
        <PageHeader.Actions>
          <Select value={String(range)} onValueChange={(value) => void setRange(Number(value))}>
            <Select.Trigger size="sm" aria-label={t('dashboard.range')} className="w-40">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {RANGES.map((days) => (
                <Select.Item key={days} value={String(days)}>
                  {t(`dashboard.ranges.${days}`)}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </PageHeader.Actions>
      </PageHeader>

      {metrics.isError ? (
        <Alert tone="danger">
          <Alert.Title>{t('dashboard.error.title')}</Alert.Title>
          <Alert.Description className="flex flex-wrap items-center gap-3">
            {t('dashboard.error.description')}
            <Button size="sm" variant="outline" onClick={() => void metrics.refetch()}>
              {t('retry')}
            </Button>
          </Alert.Description>
        </Alert>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t('dashboard.stats.visits')}
              value={formatNumber(figures.visits.value)}
              caption={caption(figures.visits.trend)}
              trend={trend(figures.visits.trend)}
              loading={loading}
              href="/schedule?view=agenda"
              sparkline={<Sparkline data={figures.visits.series} valueKey="value" aria-label={t('dashboard.sparkline.visits')} />}
            />
            <StatCard
              label={t('dashboard.stats.newPatients')}
              value={formatNumber(figures.newPatients.value)}
              caption={caption(figures.newPatients.trend)}
              trend={trend(figures.newPatients.trend)}
              loading={loading}
              href="/patients?sort=created"
              sparkline={<Sparkline data={figures.newPatients.series} valueKey="value" aria-label={t('dashboard.sparkline.newPatients')} />}
            />
            <StatCard
              label={t('dashboard.stats.noShowRate')}
              value={formatNumber(figures.noShowRate.value, { style: 'percent', maximumFractionDigits: 1 })}
              caption={caption(figures.noShowRate.trend)}
              trend={trend(figures.noShowRate.trend, 'down')}
              loading={loading}
              href="/schedule?view=agenda"
              sparkline={
                <Sparkline
                  data={figures.noShowRate.series}
                  valueKey="value"
                  tone="warning"
                  aria-label={t('dashboard.sparkline.noShowRate')}
                />
              }
            />
            <StatCard
              label={t('dashboard.stats.revenue')}
              value={<Money value={figures.revenue.value} compact tone="none" />}
              caption={caption(figures.revenue.trend)}
              trend={trend(figures.revenue.trend)}
              loading={loading}
              href="/billing"
              sparkline={<Sparkline data={figures.revenue.series} valueKey="value" aria-label={t('dashboard.sparkline.revenue')} />}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Panel title={t('dashboard.charts.visits')} className="xl:col-span-2">
              <AreaChart
                data={series}
                stacked
                loading={loading}
                x={{ key: 'date', format: shortDate }}
                series={[
                  { key: 'completed', label: t('dashboard.charts.completed'), tone: 'chart-1' },
                  { key: 'noShows', label: t('dashboard.charts.noShows'), tone: 'chart-4' },
                ]}
                aria-label={t('dashboard.charts.visits')}
              />
            </Panel>

            <Panel title={t('dashboard.charts.payerMix')}>
              <DonutChart
                data={mix}
                nameKey="name"
                valueKey="value"
                loading={loading}
                centerLabel={t('dashboard.charts.payerCenter')}
                centerValue={formatNumber(mix[0].value + mix[1].value)}
                aria-label={t('dashboard.charts.payerMix')}
              />
            </Panel>

            <Panel title={t('dashboard.charts.revenueByDoctor')} className="xl:col-span-2">
              <BarChart
                data={byDoctor}
                orientation="horizontal"
                valueFormat="money"
                loading={loading || doctors.isPending}
                x={{ key: 'doctor' }}
                series={[{ key: 'revenue', label: t('dashboard.charts.revenue'), tone: 'chart-2' }]}
                aria-label={t('dashboard.charts.revenueByDoctor')}
              />
            </Panel>

            <TodayPanel />
          </div>
        </>
      )}
    </div>
  );
}

export default OperationsDashboard;
