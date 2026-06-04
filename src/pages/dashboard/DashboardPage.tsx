import { type ElementType } from 'react';

import { Card } from '@components/ui';

import { cn } from '@utils';

import { Activity, ArrowDownRight, ArrowUpRight, DollarSign, TrendingUp, Users } from 'lucide-react';

type Stat = { label: string; value: string; delta: number; icon: ElementType };

const STATS: Stat[] = [
  { label: 'Total Users', value: '12,840', delta: 12.5, icon: Users },
  { label: 'Revenue', value: '$48,210', delta: 8.2, icon: DollarSign },
  { label: 'Active Sessions', value: '2,318', delta: -3.1, icon: Activity },
  { label: 'Conversion', value: '4.7%', delta: 1.4, icon: TrendingUp },
];

const CHART_DATA = [32, 40, 35, 50, 49, 60, 70, 65, 72, 80, 76, 92];

const ACTIVITY = [
  { id: 1, name: 'Sarah Chen', action: 'created a new project', time: '2m ago' },
  { id: 2, name: 'Alex Morgan', action: 'commented on Design Review', time: '18m ago' },
  { id: 3, name: 'Jordan Lee', action: 'merged pull request #142', time: '1h ago' },
  { id: 4, name: 'Taylor Kim', action: 'updated billing settings', time: '3h ago' },
  { id: 5, name: 'Chris Park', action: 'invited 3 team members', time: '5h ago' },
];

function StatCard({ stat }: { stat: Stat }) {
  const positive = stat.delta >= 0;

  return (
    <Card className="border-border border">
      <Card.Content className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">{stat.label}</span>

          <span className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <stat.icon className="h-4 w-4" />
          </span>
        </div>

        <div className="flex items-end justify-between">
          <span className="text-foreground text-2xl font-bold">{stat.value}</span>

          <span className={cn('flex items-center gap-0.5 text-xs font-medium', positive ? 'text-success' : 'text-destructive')}>
            {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(stat.delta)}%
          </span>
        </div>
      </Card.Content>
    </Card>
  );
}

function AreaChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = 100 / (data.length - 1);

  const toY = (value: number) => 38 - ((value - min) / range) * 34;
  const linePoints = data.map((value, index) => `${index * stepX},${toY(value)}`).join(' ');
  const areaPath = `M0,40 L${data.map((value, index) => `${index * stepX},${toY(value)}`).join(' L')} L100,40 Z`;

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-48 w-full" role="img" aria-label="Revenue trend">
      <defs>
        <linearGradient id="dashboard-area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={areaPath} fill="url(#dashboard-area-fill)" />

      <polyline
        points={linePoints}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function ActivityList() {
  return (
    <ul className="flex flex-col">
      {ACTIVITY.map((item) => (
        <li key={item.id} className="border-border flex items-center gap-3 py-3 not-last:border-b">
          <span className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
            {item.name.charAt(0)}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm">
              <span className="font-medium">{item.name}</span> {item.action}
            </p>
          </div>

          <span className="text-muted-foreground shrink-0 text-xs">{item.time}</span>
        </li>
      ))}
    </ul>
  );
}

function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-foreground text-2xl font-bold">Dashboard</h1>

        <p className="text-muted-foreground text-sm">Welcome back, here's what's happening.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border border lg:col-span-2">
          <Card.Header>
            <Card.Title className="text-base">Revenue overview</Card.Title>

            <Card.Description>Last 12 months</Card.Description>
          </Card.Header>

          <Card.Content>
            <AreaChart data={CHART_DATA} />
          </Card.Content>
        </Card>

        <Card className="border-border border">
          <Card.Header>
            <Card.Title className="text-base">Recent activity</Card.Title>
          </Card.Header>

          <Card.Content className="py-0">
            <ActivityList />
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
