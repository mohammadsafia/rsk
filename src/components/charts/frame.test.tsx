// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { ChartFrame, type ChartFrameProps, toneColor } from '@components/charts';

import { MotionProvider } from '@contexts';

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

type Row = (typeof data)[number];

const Frame = (props: Partial<ChartFrameProps<Row>>) => (
  <ChartFrame<Row>
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

  it('shows an em dash in the table for null or missing values, matching the gap in the chart', () => {
    render(
      <Frame
        data={[
          { month: 'Jan', visits: 120, revenue: 0.12 },
          { month: 'Feb', visits: null as unknown as number, revenue: undefined as unknown as number },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'View as table' }));
    const febRow = screen.getByText('Feb').closest('tr')!;
    expect([...febRow.querySelectorAll('td')].slice(1).map((cell) => cell.textContent)).toEqual(['—', '—']);
  });

  it('forgets hidden series that no longer exist, so the plot never goes blank', () => {
    const { rerender } = render(<Frame />);
    fireEvent.click(screen.getByRole('button', { name: 'Visits' }));
    rerender(<Frame series={[{ key: 'visits', label: 'Visits' }]} />);
    expect(screen.getByTestId('plot').textContent).toBe('visits:var(--chart-1)');
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

  it('does not animate the first paint, then animates data updates', () => {
    const seen: boolean[] = [];
    const Spy = ({ rows }: { rows: Row[] }) => (
      <ChartFrame<Row> aria-label="Visits" data={rows} series={series} xKey="month" formatValue={String} formatX={String}>
        {({ animate }) => {
          seen.push(animate);
          return null;
        }}
      </ChartFrame>
    );
    const { rerender } = render(<Spy rows={data} />);
    expect(seen[0]).toBe(false);
    rerender(<Spy rows={data} />);
    expect(seen.at(-1)).toBe(false);
    rerender(<Spy rows={[...data, { month: 'Mar', visits: 90, revenue: 0.1 }]} />);
    expect(seen.at(-1)).toBe(true);
  });

  it('never animates under reduced motion', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({ matches: query.includes('reduce'), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
    );
    const seen: boolean[] = [];
    const tree = (rows: Row[]) => (
      <MotionProvider>
        <ChartFrame<Row> aria-label="Visits" data={rows} series={series} xKey="month" formatValue={String} formatX={String}>
          {({ animate }) => {
            seen.push(animate);
            return null;
          }}
        </ChartFrame>
      </MotionProvider>
    );
    const { rerender } = render(tree(data));
    rerender(tree([...data, { month: 'Mar', visits: 90, revenue: 0.1 }]));
    expect(seen.length).toBeGreaterThan(1);
    expect(seen.every((value) => value === false)).toBe(true);
    vi.restoreAllMocks();
  });

  it('stays still when data first arrives after loading, then animates later updates', () => {
    const seen: boolean[] = [];
    const Spy = ({ rows, loading }: { rows: Row[]; loading?: boolean }) => (
      <ChartFrame<Row> aria-label="Visits" data={rows} series={series} xKey="month" formatValue={String} formatX={String} loading={loading}>
        {({ animate }) => {
          seen.push(animate);
          return null;
        }}
      </ChartFrame>
    );
    const { rerender } = render(<Spy rows={[]} loading />);
    rerender(<Spy rows={data} />);
    expect(seen.at(-1)).toBe(false);
    rerender(<Spy rows={[...data, { month: 'Mar', visits: 90, revenue: 0.1 }]} />);
    expect(seen.at(-1)).toBe(true);
  });

  it('gives the keyboard-focusable chart surface the kit focus ring, not the browser default', () => {
    render(<Frame />);
    expect(document.querySelector('[data-slot="chart-plot"]')?.className).toContain('[&_.recharts-surface]:focus-ring');
  });
});
