# Kit depth — Plan B: charts — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `@components/charts` family — LineChart, AreaChart, BarChart, DonutChart, Sparkline — on recharts 3, reading kit tokens, formatted for the app language, RTL-aware, accessible (legend toggles, "View as table"), with docs pages.

**Architecture:** One shared `ChartFrame` owns everything that isn't drawing: the legend (series toggles), the "View as table" toggle and table, loading and empty states, the height box, direction and reduced motion. Each chart is a thin recharts composition that receives the visible series and formatters from the frame through a render prop. Colours are CSS variables (`var(--chart-n)`), so dark mode needs no JS. The family is imported only from `@components/charts`, never re-exported from `ui` or `shared`, so recharts loads only on pages that chart.

**Tech Stack:** recharts 3.10.1 (+ `react-is` 18 peer), React 18, TypeScript, Tailwind v4 tokens, react-i18next, Vitest + Testing Library (happy-dom), MDX docs.

**Spec:** `docs/superpowers/specs/2026-10-16-kit-depth-design.md` (Plan B section).

## Global Constraints

- Semantic tokens only; the forbidden-pattern baseline (`P ds:baseline`) stays `{}`. No hex colours anywhere in chart code; colours are `var(--…)` strings.
- English and Arabic for all copy; RTL-correct (in Arabic the category axis is reversed and the value axis is on the right); Western digits.
- Every new component ships with tests (TDD) and a docs page with the enforced anatomy (titled `<Example>`s, `PropsTable`, Accessibility, RTL notes). `docs:lint` and the render-all test pass.
- Docs stay dev-only. `@components/charts` must not be re-exported from `@components/ui` or `@components/shared`.
- New dependency: `recharts` only (plus its required `react-is` peer). No other chart or animation libraries.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. `P() { corepack pnpm@10.34.7 "$@"; }`.
- New MDX pages: run `rm -rf node_modules/.vitest-cache node_modules/.vite node_modules/.vite-temp` before tests so the registry glob sees them.

## Review Focus

1. **Hiding the last series.** Clicking the only visible legend item must not leave an empty chart: the last visible series can't be hidden. → Task 2 test.
2. **Empty and loading data.** `data=[]` shows the empty state, and `loading` shows a skeleton, for every chart (no blank SVG, no crash). → Task 2 frame tests + one per chart.
3. **Arabic time axis.** In Arabic the first category is drawn to the right of the last. → Task 3 test.
4. **Value formatting in the table view.** "View as table" shows the same formatted values (money, percent) as the tooltip, with LTR-isolated numbers. → Task 2 test.
5. **Sparkline with fewer than two points.** A Sparkline with 0 or 1 points renders an empty labelled box, not an error. → Task 5 test.

---

## File Structure

| File | Responsibility |
|---|---|
| `package.json` | `recharts`, `react-is` |
| `src/styles/tokens.css`, `src/styles/theme.css` | `--chart-1…6` light + dark, `--color-chart-*` |
| `tests/design-system/contrast.test.ts` | chart colours ≥3:1 on `surface` |
| `src/components/charts/types.ts` | `ChartSeries`, `ChartTone`, `ValueFormat`, `ChartBaseProps` |
| `src/components/charts/chart-theme.ts` | `toneColor`, `AXIS`, `GRID` |
| `src/components/charts/useChartFormat.ts` | value / x formatters |
| `src/components/charts/ChartFrame.tsx` | legend, table toggle, states, box, direction, motion |
| `src/components/charts/ChartTooltip.tsx` | kit tooltip content |
| `src/components/charts/{LineChart,AreaChart,BarChart,DonutChart,Sparkline}.tsx` | the charts |
| `src/components/charts/{charts.test.tsx,frame.test.tsx}` | tests |
| `src/components/charts/index.ts` | barrel |
| `src/locales/{en,ar}/common.json` | `charts.*` |
| `src/component-docs/charts/*.mdx` | five docs pages (category Charts) |
| `src/component-docs/docs-nav.ts`, `src/locales/{en,ar}/docs.json`, `src/pages/docs/DocsComponentsPage.tsx` | Charts nav group + glyph |
| `src/component-docs/shared/StatCard.mdx` | sparkline example |

---

### Task 1: Dependency and chart tokens

**Files:** `package.json`, `pnpm-lock.yaml`, `src/styles/tokens.css`, `src/styles/theme.css`, `tests/design-system/contrast.test.ts`

- [ ] **Step 1: Install** — `P add recharts@3.10.1 react-is@18.3.1` → Expected: both in `dependencies`.

- [ ] **Step 2: Write the failing test** — in `tests/design-system/contrast.test.ts` add to `PAIRS` (after `['fg-subtle', 'surface', UI]`):

```ts
  ['chart-1', 'surface', UI],
  ['chart-2', 'surface', UI],
  ['chart-3', 'surface', UI],
  ['chart-4', 'surface', UI],
  ['chart-5', 'surface', UI],
  ['chart-6', 'surface', UI],
```

- [ ] **Step 3: Run it** — `P exec vp test --run tests/design-system/contrast` → Expected: FAIL (tokens `chart-*` unresolved).

- [ ] **Step 4: Implement** — `tokens.css`, in `:root, .light` after the `--info*` block:

```css
  /* Categorical chart palette: accent first, then distinct hues; each ≥3:1 on surface. */
  --chart-1: var(--accent);
  --chart-2: oklch(0.45 0.02 264);
  --chart-3: oklch(0.52 0.09 200);
  --chart-4: oklch(0.58 0.12 70);
  --chart-5: oklch(0.5 0.1 290);
  --chart-6: oklch(0.52 0.11 150);
```

and in `.dark` after its `--info*` block:

```css
  --chart-1: var(--accent);
  --chart-2: oklch(0.8 0.01 264);
  --chart-3: oklch(0.74 0.09 200);
  --chart-4: oklch(0.8 0.12 75);
  --chart-5: oklch(0.72 0.1 290);
  --chart-6: oklch(0.75 0.12 155);
```

`theme.css`, next to the other colour roles:

```css
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-chart-6: var(--chart-6);
```

- [ ] **Step 5: Run it** — `P exec vp test --run tests/design-system` → Expected: PASS. If one colour fails 3:1, lower its lightness (light mode) or raise it (dark mode) by 0.03 steps until it passes, and ledger the value.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/styles tests/design-system/contrast.test.ts
git commit -m "feat(charts): add recharts and a contrast-tested categorical chart palette

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Chart foundation — types, formatting, ChartFrame, ChartTooltip

**Files:**
- Create: `src/components/charts/types.ts`, `chart-theme.ts`, `useChartFormat.ts`, `ChartFrame.tsx`, `ChartTooltip.tsx`, `frame.test.tsx`, `index.ts`
- Modify: `src/locales/{en,ar}/common.json`

**Interfaces:**
- Produces:
  - `type ChartTone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'chart-6' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'`
  - `type ChartSeries = { key: string; label: string; tone?: ChartTone }`
  - `type ValueFormat = 'number' | 'percent' | 'money' | ((value: number) => string)` (percent takes fractions: 0.12 → 12%)
  - `type ChartBaseProps<T> = { data: T[]; series: ChartSeries[]; x: { key: keyof T & string; format?: (value: unknown) => string }; valueFormat?: ValueFormat; currency?: string; height?: number; loading?: boolean; empty?: ReactNode; 'aria-label': string; className?: string }`
  - `toneColor(tone: ChartTone | undefined, index: number): string`
  - `useChartFormat({ valueFormat, currency, xFormat }): { formatValue(v: number): string; formatX(v: unknown): string }`
  - `<ChartFrame>` props: `{ aria-label, data, series, height, loading, empty, className, formatValue, formatX, xKey, table?: { columns: string[]; rows: { key: string; cells: ReactNode[] }[] }, legend?: boolean, children: (ctx: { visible: (ChartSeries & { color: string })[]; isRTL: boolean; animate: boolean }) => ReactNode }`
  - `<ChartTooltip formatValue formatX />` (recharts `content` element)

- [ ] **Step 1: Locale keys** — en `common.json`:

```json
  "charts": {
    "viewTable": "View as table",
    "viewChart": "View as chart",
    "empty": "No data for this period",
    "legend": "Series"
  },
```

ar:

```json
  "charts": {
    "viewTable": "عرض كجدول",
    "viewChart": "عرض كرسم بياني",
    "empty": "لا توجد بيانات لهذه الفترة",
    "legend": "السلاسل"
  },
```

- [ ] **Step 2: Write the failing test** — `src/components/charts/frame.test.tsx`

```tsx
// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { ChartFrame, toneColor } from '@components/charts';

import '../../i18n';

afterEach(cleanup);

const data = [
  { month: 'Jan', visits: 120, revenue: 0.12 },
  { month: 'Feb', visits: 150, revenue: 0.2 },
];

const series = [
  { key: 'visits', label: 'Visits' },
  { key: 'revenue', label: 'Revenue' },
];

const Frame = (props: Partial<Parameters<typeof ChartFrame>[0]>) => (
  <ChartFrame
    aria-label="Visits and revenue by month"
    data={data}
    series={series}
    xKey="month"
    formatValue={(value) => `${value}!`}
    formatX={(value) => String(value)}
    {...props}
  >
    {({ visible }) => <div data-testid="plot">{visible.map((item) => `${item.key}:${item.color}`).join('|')}</div>}
  </ChartFrame>
);

describe('ChartFrame', () => {
  it('is a labelled figure that passes visible series with token colours', () => {
    render(<Frame />);
    expect(screen.getByRole('figure', { name: 'Visits and revenue by month' })).toBeTruthy();
    expect(screen.getByTestId('plot').textContent).toBe('visits:var(--chart-1)|revenue:var(--chart-2)');
  });

  it('toggles series from the legend but never hides the last one', () => {
    render(<Frame />);
    const visits = screen.getByRole('button', { name: 'Visits' });
    const revenue = screen.getByRole('button', { name: 'Revenue' });

    fireEvent.click(visits);
    expect(visits.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByTestId('plot').textContent).toBe('revenue:var(--chart-2)');

    fireEvent.click(revenue);
    expect(revenue.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('plot').textContent).toBe('revenue:var(--chart-2)');
  });

  it('shows the same formatted values as a table, LTR-isolated', () => {
    render(<Frame />);
    fireEvent.click(screen.getByRole('button', { name: 'View as table' }));
    expect(screen.queryByTestId('plot')).toBeNull();
    const cell = screen.getByText('150!');
    expect(cell.closest('td')).not.toBeNull();
    expect(cell.closest('[dir="ltr"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'View as chart' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('shows a skeleton while loading and the empty state with no data', () => {
    const { rerender } = render(<Frame loading />);
    expect(screen.queryByTestId('plot')).toBeNull();
    expect(screen.getByRole('figure').getAttribute('aria-busy')).toBe('true');

    rerender(<Frame data={[]} />);
    expect(screen.getByText('No data for this period')).toBeTruthy();
    expect(screen.queryByTestId('plot')).toBeNull();
  });

  it('resolves tones and falls back to the palette by index', () => {
    expect(toneColor('success', 0)).toBe('var(--success)');
    expect(toneColor('neutral', 0)).toBe('var(--fg-muted)');
    expect(toneColor(undefined, 7)).toBe('var(--chart-2)');
  });
});
```

- [ ] **Step 3: Run it** — `P exec vp test --run src/components/charts` → Expected: FAIL (module `@components/charts` missing).

- [ ] **Step 4: Implement**

`types.ts`:

```ts
import type { ReactNode } from 'react';

export type ChartTone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'chart-6' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export type ChartSeries = { key: string; label: string; tone?: ChartTone };

/** `percent` expects fractions (0.12 → 12%). */
export type ValueFormat = 'number' | 'percent' | 'money' | ((value: number) => string);

export type ChartBaseProps<T> = {
  data: T[];
  series: ChartSeries[];
  x: { key: keyof T & string; format?: (value: unknown) => string };
  valueFormat?: ValueFormat;
  currency?: string;
  height?: number;
  loading?: boolean;
  empty?: ReactNode;
  'aria-label': string;
  className?: string;
};

export type VisibleSeries = ChartSeries & { color: string };
```

`chart-theme.ts`:

```ts
import type { ChartTone } from './types';

/** A token colour for a series: its tone, or the categorical palette by position. */
export const toneColor = (tone: ChartTone | undefined, index: number): string => {
  if (tone === 'neutral') return 'var(--fg-muted)';
  if (tone) return `var(--${tone})`;
  return `var(--chart-${(index % 6) + 1})`;
};

export const AXIS = {
  stroke: 'var(--border)',
  tick: { fill: 'var(--fg-muted)', fontSize: 12 },
  tickLine: false,
  axisLine: false,
} as const;

export const GRID = { stroke: 'var(--border-subtle)', strokeDasharray: '3 3' } as const;
```

`useChartFormat.ts`:

```ts
import { useTranslation } from 'react-i18next';

import { formatMoney, formatNumber } from '@utils';

import type { ValueFormat } from './types';

export const useChartFormat = ({ valueFormat = 'number', currency, xFormat }: { valueFormat?: ValueFormat; currency?: string; xFormat?: (value: unknown) => string }) => {
  const { i18n } = useTranslation();
  const language = i18n.language;

  const formatValue = (value: number): string => {
    if (typeof valueFormat === 'function') return valueFormat(value);
    if (valueFormat === 'money') return formatMoney(value, language, { currency, compact: Math.abs(value) >= 10_000 });
    if (valueFormat === 'percent') return formatNumber(value, language, { style: 'percent', maximumFractionDigits: 1 });
    return formatNumber(value, language, { maximumFractionDigits: 2 });
  };

  const formatX = (value: unknown): string => (xFormat ? xFormat(value) : String(value ?? ''));

  return { formatValue, formatX };
};
```

`ChartFrame.tsx`:

```tsx
import { type ReactNode, useState } from 'react';

import { Button, EmptyState, Skeleton, Table } from '@components/ui';
import { Conditional } from '@components/utils';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { toneColor } from './chart-theme';
import type { ChartSeries, VisibleSeries } from './types';

type FrameContext = { visible: VisibleSeries[]; isRTL: boolean; animate: boolean };

export type ChartFrameProps<T> = {
  'aria-label': string;
  data: T[];
  series: ChartSeries[];
  xKey: keyof T & string;
  formatValue: (value: number) => string;
  formatX: (value: unknown) => string;
  height?: number;
  loading?: boolean;
  empty?: ReactNode;
  className?: string;
  /** Override the table view (DonutChart lists slices). */
  table?: { columns: string[]; rows: { key: string; cells: ReactNode[] }[] };
  /** Show the series legend. @default series.length > 1 */
  legend?: boolean;
  children: (context: FrameContext) => ReactNode;
};

const prefersReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function ChartFrame<T>({
  'aria-label': ariaLabel,
  data,
  series,
  xKey,
  formatValue,
  formatX,
  height = 280,
  loading = false,
  empty,
  className,
  table,
  legend,
  children,
}: ChartFrameProps<T>) {
  const { t, isRTL } = useAppTranslation('common');
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [asTable, setAsTable] = useState(false);
  const [animate] = useState(() => !prefersReducedMotion());

  const colored: VisibleSeries[] = series.map((item, index) => ({ ...item, color: toneColor(item.tone, index) }));
  const visible = colored.filter((item) => !hidden.has(item.key));
  const showLegend = legend ?? series.length > 1;
  const isEmpty = !loading && data.length === 0;

  const toggle = (key: string) =>
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else if (colored.length - next.size > 1) next.add(key);
      return next;
    });

  const tableModel = table ?? {
    columns: ['', ...colored.map((item) => item.label)],
    rows: data.map((datum, index) => {
      const record = datum as Record<string, unknown>;
      return {
        key: String(record[xKey] ?? index),
        cells: [formatX(record[xKey]), ...colored.map((item) => formatValue(Number(record[item.key])))],
      };
    }),
  };

  return (
    <figure data-slot="chart" aria-label={ariaLabel} aria-busy={loading || undefined} className={cn('flex w-full flex-col gap-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Conditional.If condition={showLegend && !asTable}>
          <div role="group" aria-label={t('charts.legend')} className="flex flex-wrap items-center gap-1">
            {colored.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-pressed={!hidden.has(item.key)}
                onClick={() => toggle(item.key)}
                className="focus-ring text-fg-muted aria-pressed:text-fg hover:bg-hover inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-xs transition-colors"
              >
                <span aria-hidden="true" className="size-2 rounded-full" style={{ background: hidden.has(item.key) ? 'var(--border-strong)' : item.color }} />
                {item.label}
              </button>
            ))}
          </div>
        </Conditional.If>

        <Button variant="ghost" size="sm" className="ms-auto" aria-pressed={asTable} onClick={() => setAsTable((value) => !value)}>
          {t(asTable ? 'charts.viewChart' : 'charts.viewTable')}
        </Button>
      </div>

      <Conditional>
        <Conditional.If condition={loading}>
          <Skeleton shape="block" className="w-full" style={{ height }} />
        </Conditional.If>
        <Conditional.If condition={isEmpty}>{empty ?? <EmptyState size="sm" kind="no-results" title={t('charts.empty')} />}</Conditional.If>
        <Conditional.If condition={asTable}>
          <div className="border-border overflow-hidden rounded-lg border">
            <Table aria-label={ariaLabel}>
              <Table.Header>
                <Table.Row>
                  {tableModel.columns.map((column, index) => (
                    <Table.Head key={`${column}-${index}`} numeric={index > 0}>
                      {column}
                    </Table.Head>
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {tableModel.rows.map((row) => (
                  <Table.Row key={row.key}>
                    {row.cells.map((cell, index) => (
                      <Table.Cell key={index} numeric={index > 0}>
                        {cell}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </Conditional.If>
        <Conditional.Else>
          <div data-slot="chart-plot" className="w-full" style={{ height }}>
            {children({ visible, isRTL, animate })}
          </div>
        </Conditional.Else>
      </Conditional>
    </figure>
  );
}
```

`Table.Cell numeric` already wraps content in `dir="ltr"` and tabular mono. `Skeleton` takes `style`, since it spreads HTML attributes.

`ChartTooltip.tsx`:

```tsx
import type { TooltipContentProps } from 'recharts';

type ChartTooltipProps = Partial<TooltipContentProps<number, string>> & {
  formatValue: (value: number) => string;
  formatX: (value: unknown) => string;
};

/** Raised-surface tooltip: x label, then a dot · name · value row per series. */
export function ChartTooltip({ active, payload, label, formatValue, formatX }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div data-slot="chart-tooltip" className="bg-surface-raised text-fg shadow-raised flex min-w-36 flex-col gap-1 rounded-md px-3 py-2 text-xs">
      <span className="text-fg-muted">{formatX(label)}</span>
      {payload.map((entry) => (
        <span key={String(entry.dataKey)} className="flex items-center gap-2">
          <span aria-hidden="true" className="size-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-fg-muted">{entry.name}</span>
          <span dir="ltr" className="text-fg ms-auto font-mono tabular-nums">
            {formatValue(Number(entry.value))}
          </span>
        </span>
      ))}
    </div>
  );
}
```

If recharts 3.10 names the type differently, use `TooltipProps<number, string>` from `recharts`. Check `node_modules/recharts/types/index.d.ts` and ledger the change.

`index.ts`:

```ts
export * from './types';
export { toneColor } from './chart-theme';
export { useChartFormat } from './useChartFormat';
export { ChartFrame, type ChartFrameProps } from './ChartFrame';
export { ChartTooltip } from './ChartTooltip';
```

- [ ] **Step 5: Run it** — `P exec vp test --run src/components/charts tests/i18n` → Expected: PASS (5 + parity).

- [ ] **Step 6: Commit**

```bash
git add src/components/charts src/locales
git commit -m "feat(charts): ChartFrame — legend toggles, table view, loading and empty states, token colours

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: LineChart and AreaChart

**Files:** create `src/components/charts/LineChart.tsx`, `AreaChart.tsx`, `charts.test.tsx`; modify `index.ts`

**Interfaces:**
- Consumes: `ChartFrame`, `ChartTooltip`, `useChartFormat`, `AXIS`, `GRID`, `ChartBaseProps` (Task 2).
- Produces: `LineChart<T>(props: ChartBaseProps<T> & { curve?: 'monotone' | 'linear' })`; `AreaChart<T>(props: ChartBaseProps<T> & { stacked?: boolean })`.

- [ ] **Step 1: Write the failing test** — `src/components/charts/charts.test.tsx`

```tsx
// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { AreaChart, LineChart } from '@components/charts';

import i18n from '../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

const data = [
  { day: 'Mon', visits: 32, booked: 40 },
  { day: 'Tue', visits: 41, booked: 38 },
  { day: 'Wed', visits: 28, booked: 35 },
];
const series = [
  { key: 'visits', label: 'Visits' },
  { key: 'booked', label: 'Booked' },
];

const tickXs = () =>
  [...document.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick-value')].map((node) => ({
    text: node.textContent,
    x: Number(node.getAttribute('x')),
  }));

describe('LineChart', () => {
  it('draws one token-coloured line per series, no hex colours', () => {
    render(<LineChart aria-label="Visits this week" data={data} series={series} x={{ key: 'day' }} />);
    const lines = [...document.querySelectorAll('.recharts-line-curve')];
    expect(lines).toHaveLength(2);
    expect(lines.map((line) => line.getAttribute('stroke'))).toEqual(['var(--chart-1)', 'var(--chart-2)']);
    expect(document.querySelector('[data-slot="chart"]')?.innerHTML).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });

  it('runs the category axis right to left in Arabic', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(<LineChart aria-label="Visits this week" data={data} series={series} x={{ key: 'day' }} />);
    const ticks = tickXs();
    const mon = ticks.find((tick) => tick.text === 'Mon')!;
    const wed = ticks.find((tick) => tick.text === 'Wed')!;
    expect(mon.x).toBeGreaterThan(wed.x);
  });

  it('shows the empty state for no data', () => {
    render(<LineChart aria-label="Visits this week" data={[]} series={series} x={{ key: 'day' }} />);
    expect(screen.getByText('No data for this period')).toBeTruthy();
  });
});

describe('AreaChart', () => {
  it('draws filled areas, stacked on request', () => {
    render(<AreaChart aria-label="Visits this week" data={data} series={series} x={{ key: 'day' }} stacked />);
    const areas = [...document.querySelectorAll('.recharts-area-area')];
    expect(areas).toHaveLength(2);
    expect(areas[0].getAttribute('fill')).toBe('var(--chart-1)');
  });
});
```

- [ ] **Step 2: Run it** — `P exec vp test --run src/components/charts/charts` → Expected: FAIL (`LineChart` not exported).

- [ ] **Step 3: Implement** — `LineChart.tsx`:

```tsx
import { CartesianGrid, Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { AXIS, GRID } from './chart-theme';
import { ChartFrame } from './ChartFrame';
import { ChartTooltip } from './ChartTooltip';
import type { ChartBaseProps } from './types';
import { useChartFormat } from './useChartFormat';

export type LineChartProps<T> = ChartBaseProps<T> & { curve?: 'monotone' | 'linear' };

export function LineChart<T>({ data, series, x, valueFormat, currency, height = 280, loading, empty, className, curve = 'monotone', ...rest }: LineChartProps<T>) {
  const { formatValue, formatX } = useChartFormat({ valueFormat, currency, xFormat: x.format });

  return (
    <ChartFrame
      aria-label={rest['aria-label']}
      data={data}
      series={series}
      xKey={x.key}
      formatValue={formatValue}
      formatX={formatX}
      height={height}
      loading={loading}
      empty={empty}
      className={className}
    >
      {({ visible, isRTL, animate }) => (
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height }}>
          <RechartsLineChart data={data} accessibilityLayer margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid vertical={false} {...GRID} />
            <XAxis dataKey={x.key} reversed={isRTL} tickFormatter={formatX} {...AXIS} />
            <YAxis orientation={isRTL ? 'right' : 'left'} width={64} tickFormatter={(value: number) => formatValue(value)} {...AXIS} />
            <Tooltip content={<ChartTooltip formatValue={formatValue} formatX={formatX} />} cursor={{ stroke: 'var(--border-strong)' }} />
            {visible.map((item) => (
              <Line
                key={item.key}
                dataKey={item.key}
                name={item.label}
                type={curve}
                stroke={item.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={animate}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}
```

`AreaChart.tsx` follows the same structure with `AreaChart as RechartsAreaChart` and `Area` from recharts, a `stacked?: boolean` prop, and per series:

```tsx
              <Area
                key={item.key}
                dataKey={item.key}
                name={item.label}
                type="monotone"
                stroke={item.color}
                fill={item.color}
                fillOpacity={0.12}
                strokeWidth={2}
                stackId={stacked ? 'stack' : undefined}
                isAnimationActive={animate}
              />
```

Write `AreaChart.tsx` out in full (same imports, frame and axes as `LineChart.tsx`; swap the chart and series elements).

Add to `index.ts`:

```ts
export { LineChart, type LineChartProps } from './LineChart';
export { AreaChart, type AreaChartProps } from './AreaChart';
```

- [ ] **Step 4: Run it** — `P exec vp test --run src/components/charts` → Expected: PASS. If happy-dom renders no ticks (zero size), keep `initialDimension` and also give the plot box an explicit `width: 640` only in the test by passing `className="w-[640px]"`. Ledger whichever is needed.

- [ ] **Step 5: Commit**

```bash
git add src/components/charts
git commit -m "feat(charts): LineChart and AreaChart — token colours, RTL axis, kit tooltip, reduced motion

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: BarChart

**Files:** create `src/components/charts/BarChart.tsx`; modify `charts.test.tsx`, `index.ts`

**Interfaces:** Produces `BarChart<T>(props: ChartBaseProps<T> & { orientation?: 'vertical' | 'horizontal'; stacked?: boolean })`. `orientation` is the direction the bars grow (`vertical` = columns, the default).

- [ ] **Step 1: Failing test** — append to `charts.test.tsx`:

```tsx
import { BarChart } from '@components/charts';

describe('BarChart', () => {
  it('draws a bar per datum and series, horizontally on request', () => {
    const { rerender } = render(<BarChart aria-label="Revenue by clinic" data={data} series={series} x={{ key: 'day' }} />);
    expect(document.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(6);

    rerender(<BarChart aria-label="Revenue by clinic" data={data} series={series} x={{ key: 'day' }} orientation="horizontal" stacked />);
    expect(document.querySelector('.recharts-bar-rectangle path')?.getAttribute('fill')).toBe('var(--chart-1)');
  });
});
```

(Merge the `BarChart` import into the file's existing `@components/charts` import.)

- [ ] **Step 2: Run it** — Expected: FAIL (`BarChart` not exported).

- [ ] **Step 3: Implement** — `BarChart.tsx`: same frame wiring as `LineChart.tsx`. Inside `ResponsiveContainer`:

```tsx
          <RechartsBarChart
            data={data}
            layout={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
            accessibilityLayer
            margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
          >
            <CartesianGrid vertical={orientation === 'horizontal'} horizontal={orientation !== 'horizontal'} {...GRID} />
            {orientation === 'horizontal' ? (
              <>
                <XAxis type="number" reversed={isRTL} tickFormatter={(value: number) => formatValue(value)} {...AXIS} />
                <YAxis type="category" dataKey={x.key} orientation={isRTL ? 'right' : 'left'} width={96} tickFormatter={formatX} {...AXIS} />
              </>
            ) : (
              <>
                <XAxis dataKey={x.key} reversed={isRTL} tickFormatter={formatX} {...AXIS} />
                <YAxis orientation={isRTL ? 'right' : 'left'} width={64} tickFormatter={(value: number) => formatValue(value)} {...AXIS} />
              </>
            )}
            <Tooltip content={<ChartTooltip formatValue={formatValue} formatX={formatX} />} cursor={{ fill: 'var(--hover)' }} />
            {visible.map((item) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                name={item.label}
                fill={item.color}
                radius={stacked ? 0 : 4}
                stackId={stacked ? 'stack' : undefined}
                maxBarSize={40}
                isAnimationActive={animate}
              />
            ))}
          </RechartsBarChart>
```

Import `Bar, BarChart as RechartsBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis` from `recharts`. Export from `index.ts`: `export { BarChart, type BarChartProps } from './BarChart';`.

- [ ] **Step 4: Run it** — `P exec vp test --run src/components/charts` → Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/charts
git commit -m "feat(charts): BarChart — columns or bars, grouped or stacked

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: DonutChart and Sparkline

**Files:** create `src/components/charts/DonutChart.tsx`, `Sparkline.tsx`; modify `charts.test.tsx`, `index.ts`, `src/component-docs/shared/StatCard.mdx`

**Interfaces:**
- Produces:
  - `DonutChart<T>(props: { data: T[]; nameKey: keyof T & string; valueKey: keyof T & string; valueFormat?; currency?; height?: number (default 240); centerLabel?: ReactNode; centerValue?: ReactNode; loading?; empty?; 'aria-label': string; className? })`
  - `Sparkline<T>(props: { data: T[]; valueKey: keyof T & string; tone?: ChartTone (default 'accent'); height?: number (default 32); 'aria-label': string; className? })`

- [ ] **Step 1: Failing tests** — append to `charts.test.tsx` (merge the imports):

```tsx
import { DonutChart, Sparkline } from '@components/charts';

const visitTypes = [
  { type: 'In person', count: 62 },
  { type: 'Video', count: 23 },
  { type: 'Phone', count: 15 },
];

describe('DonutChart', () => {
  it('draws a slice per item with palette colours, a centre value and a slice table', () => {
    render(<DonutChart aria-label="Visits by type" data={visitTypes} nameKey="type" valueKey="count" centerLabel="Visits" centerValue="100" />);
    const slices = [...document.querySelectorAll('.recharts-pie-sector path')];
    expect(slices).toHaveLength(3);
    expect(slices[1].getAttribute('fill')).toBe('var(--chart-2)');
    expect(screen.getByText('100')).toBeTruthy();

    screen.getByRole('button', { name: 'View as table' }).click();
  });
});

describe('Sparkline', () => {
  it('is a labelled image with a single accent line', () => {
    render(<Sparkline aria-label="Visits, last 7 days" data={data} valueKey="visits" />);
    const image = screen.getByRole('img', { name: 'Visits, last 7 days' });
    expect(image.querySelector('.recharts-line-curve')?.getAttribute('stroke')).toBe('var(--accent)');
  });

  it('renders an empty labelled box with fewer than two points', () => {
    render(<Sparkline aria-label="Visits, last 7 days" data={[{ visits: 4 }]} valueKey="visits" />);
    const image = screen.getByRole('img', { name: 'Visits, last 7 days' });
    expect(image.querySelector('.recharts-line-curve')).toBeNull();
  });
});
```

- [ ] **Step 2: Run it** — Expected: FAIL (`DonutChart` not exported).

- [ ] **Step 3: Implement** — `DonutChart.tsx`:

```tsx
import { type ReactNode } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { toneColor } from './chart-theme';
import { ChartFrame } from './ChartFrame';
import { ChartTooltip } from './ChartTooltip';
import type { ValueFormat } from './types';
import { useChartFormat } from './useChartFormat';

export type DonutChartProps<T> = {
  data: T[];
  nameKey: keyof T & string;
  valueKey: keyof T & string;
  valueFormat?: ValueFormat;
  currency?: string;
  height?: number;
  centerLabel?: ReactNode;
  centerValue?: ReactNode;
  loading?: boolean;
  empty?: ReactNode;
  'aria-label': string;
  className?: string;
};

export function DonutChart<T>({ data, nameKey, valueKey, valueFormat, currency, height = 240, centerLabel, centerValue, loading, empty, className, ...rest }: DonutChartProps<T>) {
  const { formatValue, formatX } = useChartFormat({ valueFormat, currency });
  const record = (datum: T) => datum as Record<string, unknown>;
  // Each slice is a "series" so the legend toggles slices.
  const series = data.map((datum) => ({ key: String(record(datum)[nameKey]), label: String(record(datum)[nameKey]) }));

  return (
    <ChartFrame
      aria-label={rest['aria-label']}
      data={data}
      series={series}
      xKey={nameKey}
      formatValue={formatValue}
      formatX={formatX}
      height={height}
      loading={loading}
      empty={empty}
      className={className}
      table={{ columns: ['', ''], rows: data.map((datum) => ({ key: String(record(datum)[nameKey]), cells: [String(record(datum)[nameKey]), formatValue(Number(record(datum)[valueKey]))] })) }}
    >
      {({ visible, animate }) => {
        const shown = data.filter((datum) => visible.some((item) => item.key === String(record(datum)[nameKey])));
        return (
          <div className="relative h-full">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height }}>
              <PieChart accessibilityLayer>
                <Tooltip content={<ChartTooltip formatValue={formatValue} formatX={formatX} />} />
                <Pie data={shown} dataKey={valueKey} nameKey={nameKey} innerRadius="62%" outerRadius="90%" paddingAngle={2} stroke="var(--surface)" isAnimationActive={animate}>
                  {shown.map((datum) => {
                    const index = data.indexOf(datum);
                    return <Cell key={String(record(datum)[nameKey])} fill={toneColor(undefined, index)} />;
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-content-center text-center">
              <span dir="ltr" className="text-fg font-mono text-xl font-medium tabular-nums">
                {centerValue}
              </span>
              <span className="text-fg-muted text-xs">{centerLabel}</span>
            </div>
          </div>
        );
      }}
    </ChartFrame>
  );
}
```

`Sparkline.tsx`:

```tsx
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { useAppTranslation } from '@hooks/shared';

import { cn } from '@utils';

import { toneColor } from './chart-theme';
import type { ChartTone } from './types';

export type SparklineProps<T> = {
  data: T[];
  valueKey: keyof T & string;
  tone?: ChartTone;
  height?: number;
  'aria-label': string;
  className?: string;
};

/** A tiny trend line without axes, for StatCard. Needs at least two points to draw. */
export function Sparkline<T>({ data, valueKey, tone = 'accent', height = 32, className, ...rest }: SparklineProps<T>) {
  const { isRTL } = useAppTranslation('common');

  return (
    <div role="img" aria-label={rest['aria-label']} data-slot="sparkline" className={cn('w-full', className)} style={{ height }}>
      {data.length >= 2 && (
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 120, height }}>
          <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <XAxis hide reversed={isRTL} />
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Line dataKey={valueKey} type="monotone" stroke={toneColor(tone, 0)} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
```

Export both from `index.ts`.

In `src/component-docs/shared/StatCard.mdx`, import `Sparkline` from `@components/charts`, add `export const TREND = [{ v: 30 }, { v: 34 }, { v: 31 }, { v: 40 }, { v: 38 }, { v: 45 }, { v: 48 }];`, and pass `sparkline={<Sparkline aria-label="Visits, last 7 days" data={TREND} valueKey="v" />}` to the first StatCard in the Dashboard row example.

- [ ] **Step 4: Run it** — `P exec vp test --run src/components/charts src/component-docs` → Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/charts src/component-docs/shared/StatCard.mdx
git commit -m "feat(charts): DonutChart with centre value and Sparkline for StatCard

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Charts docs category and pages

**Files:**
- Modify: `src/component-docs/docs-nav.ts` (add `CHARTS` after `CALENDAR` in `ORDER`, `CHARTS: 'charts'` in `LABEL_KEY`)
- Modify: `src/locales/en/docs.json` (`nav.groups.charts: "Charts"`) and `src/locales/ar/docs.json` (`"الرسوم البيانية"`)
- Modify: `src/pages/docs/DocsComponentsPage.tsx` (`GLYPH.CHARTS = ChartLine` from lucide)
- Create: `src/component-docs/charts/{LineChart,AreaChart,BarChart,DonutChart,Sparkline}.mdx` (frontmatter `section: Components`, `category: Charts`, `importFrom: '@components/charts'`)
- Test: `src/component-docs/charts/charts-docs.test.tsx`

- [ ] **Step 1: Failing test** — `charts-docs.test.tsx`:

```tsx
import { describe, expect, it } from 'vite-plus/test';

import { docsNavGroups } from '@component-docs/docs-nav';
import { getComponentDocsRegistry } from '@component-docs/registry';

describe('charts docs', () => {
  it('has a Charts nav group with the five chart pages', () => {
    const group = docsNavGroups(getComponentDocsRegistry()).find((item) => item.key === 'CHARTS');
    expect(group?.items.map((item) => item.id)).toEqual(['area-chart', 'bar-chart', 'donut-chart', 'line-chart', 'sparkline']);
  });
});
```

- [ ] **Step 2: Run it** — Expected: FAIL (no CHARTS group).

- [ ] **Step 3: Implement** the nav, locale and glyph edits, then the five pages. Each page has:
  - **Examples:**
    - Line: "Visits per day" (two series); "Money values" (`valueFormat="money"`).
    - Area: "Stacked"; "Single series".
    - Bar: "Columns"; "Horizontal, stacked".
    - Donut: "Visits by type" with centre value.
    - Sparkline: "In a StatCard".
    - Each uses realistic clinic data defined with `export const`.
  - `## API` PropsTable: the `ChartBaseProps` rows plus the component's own props.
  - `## Accessibility`: required `aria-label` on the figure; legend buttons with `aria-pressed`; "View as table" for screen readers; recharts keyboard layer (arrow keys between points); motion off under reduced motion.
  - `## RTL notes`: in Arabic the category axis runs right to left and the value axis sits on the right; numbers stay LTR-isolated.

  Line page (write the other four the same way, with their own data and props):

````mdx
---
id: line-chart
title: LineChart
section: Components
category: Charts
description: 'Trends over time: one line per series, token colours, kit tooltip, legend toggles and a table view.'
tags: [charts, line, trend, time-series]
importFrom: '@components/charts'
---

import { LineChart } from '@components/charts';

export const WEEK = [
  { day: 'Mon', visits: 32, booked: 40 },
  { day: 'Tue', visits: 41, booked: 38 },
  { day: 'Wed', visits: 28, booked: 35 },
  { day: 'Thu', visits: 45, booked: 44 },
  { day: 'Fri', visits: 39, booked: 42 },
];

export const REVENUE = [
  { month: 'Jun', revenue: 18400 },
  { month: 'Jul', revenue: 21900 },
  { month: 'Aug', revenue: 19800 },
  { month: 'Sep', revenue: 24600 },
];

## Two series

<Example title="Visits per day">
  <LineChart
    className="w-full"
    aria-label="Visits and bookings this week; visits peaked on Thursday"
    data={WEEK}
    series={[{ key: 'visits', label: 'Visits' }, { key: 'booked', label: 'Booked' }]}
    x={{ key: 'day' }}
  />
</Example>

## Money values

<Example title="Revenue by month">
  <LineChart className="w-full" aria-label="Revenue grew from June to September" data={REVENUE} series={[{ key: 'revenue', label: 'Revenue' }]} x={{ key: 'month' }} valueFormat="money" />
</Example>

## API

<PropsTable
  rows={[
    { prop: 'aria-label', type: 'string', required: true, description: 'One-line summary of what the chart shows.' },
    { prop: 'data · series', type: 'T[] · { key; label; tone? }[]', required: true, description: 'Rows, and which keys to draw.' },
    { prop: 'x', type: '{ key; format? }', required: true, description: 'The category key and its label formatter.' },
    { prop: 'valueFormat · currency', type: "'number' | 'percent' | 'money' | (v) => string · string", default: "'number'", description: 'How values read on the axis, tooltip and table.' },
    { prop: 'height', type: 'number', default: '280', description: 'Plot height in px.' },
    { prop: 'loading · empty', type: 'boolean · ReactNode', description: 'Skeleton, or content when there is no data.' },
    { prop: 'curve', type: "'monotone' | 'linear'", default: "'monotone'", description: 'Line interpolation.' },
  ]}
/>

## Accessibility

- A `figure` named by `aria-label`; the legend's buttons toggle series with `aria-pressed`, and the last visible series can't be hidden.
- "View as table" swaps the chart for a table of the same values; arrow keys move between points (recharts accessibility layer).
- Animation is off under `prefers-reduced-motion`.

## RTL notes

- In Arabic the category axis runs right to left and the value axis sits on the right; values stay LTR-isolated with Western digits.
````

- [ ] **Step 4: Run it** — `rm -rf node_modules/.vitest-cache node_modules/.vite node_modules/.vite-temp && P docs:lint && P exec vp test --run src/component-docs tests/i18n` → Expected: PASS (five new render-all pages).

- [ ] **Step 5: Commit**

```bash
git add src/component-docs src/locales src/pages/docs/DocsComponentsPage.tsx
git commit -m "docs(charts): Charts category with Line, Area, Bar, Donut and Sparkline pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Exit — gate, bundle check and screenshots

- [ ] **Step 1: Full gate**

```bash
P ds:baseline && P exec vp fmt && P exec vp check && P exec tsc -b && P exec tsc -p tsconfig.scripts.json && \
P docs:lint && P exec vp test --run src tests && P exec vp build && \
for s in frontmatter DocsLayout recharts; do echo "$s $(grep -l "$s" dist/assets/*.js | wc -l)"; done
```

Expected: exit 0, baseline `{}`, and all three counts `0`. No production page charts yet, so recharts must be absent from `dist`.

- [ ] **Step 2: Screenshots** — dark/light × EN/AR at 1440 px of the five chart pages and the StatCard page; one with the tooltip hovered and one with "View as table" on. Check:
  - the Arabic axes are reversed
  - colours read in both themes
  - no clipped labels
  - the legend and table toggles sit on one row

  Ledger each fix with its test.

- [ ] **Step 3: Commit**

```bash
git add -A src tests && git commit -m "test(charts): Plan B exit — gate, bundle check and screenshots

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
