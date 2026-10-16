// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { ChartFrame, type ChartFrameProps, toneColor } from '@components/charts';

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
