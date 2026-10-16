import { type ElementType } from 'react';

import { Card } from '@components/ui';
import { CardGrid, DescriptionList, PageHeader } from '@components/shared';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn, type NumberFormatStyle, useNumberFormat } from '@utils';

import { Activity, ArrowDownRight, ArrowUpRight, DollarSign, TrendingUp, Users } from 'lucide-react';

type Stat = { labelKey: string; value: number; format: NumberFormatStyle; delta: number; icon: ElementType };

const STATS: Stat[] = [
  { labelKey: 'stats.totalUsers', value: 12840, format: 'decimal', delta: 12.5, icon: Users },
  { labelKey: 'stats.revenue', value: 48210, format: 'currency', delta: 8.2, icon: DollarSign },
  { labelKey: 'stats.activeSessions', value: 2318, format: 'decimal', delta: -3.1, icon: Activity },
  { labelKey: 'stats.conversion', value: 0.047, format: 'percent', delta: 1.4, icon: TrendingUp },
];

const CHART_DATA = [32, 40, 35, 50, 49, 60, 70, 65, 72, 80, 76, 92];

const ACTIVITY = [
  { id: 1, name: 'Sarah Chen', actionKey: 'activity.createdProject', timeKey: 'time.minutesAgo', timeCount: 2 },
  { id: 2, name: 'Alex Morgan', actionKey: 'activity.commentedDesignReview', timeKey: 'time.minutesAgo', timeCount: 18 },
  { id: 3, name: 'Jordan Lee', actionKey: 'activity.mergedPullRequest', timeKey: 'time.hoursAgo', timeCount: 1 },
  { id: 4, name: 'Taylor Kim', actionKey: 'activity.updatedBilling', timeKey: 'time.hoursAgo', timeCount: 3 },
  { id: 5, name: 'Chris Park', actionKey: 'activity.invitedMembers', timeKey: 'time.hoursAgo', timeCount: 5 },
];

function StatCard({ stat }: { stat: Stat }) {
  const { t } = useAppTranslation('dashboard');
  const formatNumber = useNumberFormat();
  const positive = stat.delta >= 0;

  return (
    <Card>
      <Card.Content className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-fg-muted text-sm">{t(stat.labelKey)}</span>

          <span className="bg-surface-sunken text-fg-muted flex size-8 items-center justify-center rounded-md">
            <stat.icon aria-hidden="true" className="size-4" />
          </span>
        </div>

        <div className="flex items-end justify-between gap-2">
          <span data-slot="stat-value" dir="ltr" className="text-fg text-2xl font-semibold tabular-nums">
            {formatNumber(stat.value, { style: stat.format, maximumFractionDigits: stat.format === 'percent' ? 1 : 0 })}
          </span>

          <span
            dir="ltr"
            className={cn('flex items-center gap-0.5 text-xs font-medium tabular-nums', positive ? 'text-success' : 'text-danger')}
          >
            <Conditional>
              <Conditional.If condition={positive}>
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </Conditional.If>

              <Conditional.Else>
                <ArrowDownRight aria-hidden="true" className="size-3.5" />
              </Conditional.Else>
            </Conditional>
            {formatNumber(Math.abs(stat.delta) / 100, { style: 'percent', maximumFractionDigits: 1 })}
          </span>
        </div>
      </Card.Content>
    </Card>
  );
}

function AreaChart({ data }: { data: number[] }) {
  const { t } = useAppTranslation('dashboard');
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = 100 / (data.length - 1);

  const toY = (value: number) => 38 - ((value - min) / range) * 34;
  const linePoints = data.map((value, index) => `${index * stepX},${toY(value)}`).join(' ');
  const areaPath = `M0,40 L${data.map((value, index) => `${index * stepX},${toY(value)}`).join(' L')} L100,40 Z`;

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-48 w-full" role="img" aria-label={t('revenueTrend')}>
      <defs>
        <linearGradient id="dashboard-area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={areaPath} fill="url(#dashboard-area-fill)" />

      <polyline
        points={linePoints}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function ActivityList() {
  const { t } = useAppTranslation('dashboard');

  return (
    <ul className="flex flex-col">
      {ACTIVITY.map((item) => (
        <li key={item.id} className="border-border flex items-center gap-3 py-3 not-last:border-b">
          <span
            aria-hidden="true"
            className="bg-surface-sunken text-fg-muted flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
          >
            {item.name.charAt(0)}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-fg truncate text-sm">
              <span className="font-medium">{item.name}</span> {t(item.actionKey)}
            </p>
          </div>

          <span className="text-fg-muted shrink-0 text-xs">{t(item.timeKey, { count: item.timeCount })}</span>
        </li>
      ))}
    </ul>
  );
}

function DashboardPage() {
  const { t } = useAppTranslation('dashboard');

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t('title')} description={t('subtitle')} className="pb-2" />

      <CardGrid>
        {STATS.map((stat) => (
          <StatCard key={stat.labelKey} stat={stat} />
        ))}
      </CardGrid>

      <CardGrid columns={{ base: 1, lg: 3 }}>
        <Card className="lg:col-span-2" title={t('revenueOverview')} description={t('lastTwelveMonths')}>
          <Card.Content>
            <AreaChart data={CHART_DATA} />
          </Card.Content>
        </Card>

        <Card title={t('recentActivity')}>
          <Card.Content className="py-0">
            <ActivityList />
          </Card.Content>
        </Card>
      </CardGrid>

      <Card title={t('workspace.title')} description={t('workspace.description')}>
        <Card.Content>
          <DescriptionList
            columns={3}
            items={[
              { term: t('workspace.plan'), value: t('workspace.planValue') },
              { term: t('workspace.seats'), value: '18 / 25', numeric: true },
              { term: t('workspace.renewal'), value: '2026-12-01', numeric: true },
            ]}
          />
        </Card.Content>
      </Card>
    </div>
  );
}

export default DashboardPage;
