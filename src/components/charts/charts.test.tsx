// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vite-plus/test';

import { AreaChart, BarChart, DonutChart, LineChart, Sparkline } from '@components/charts';

import i18n from '../../i18n';

// happy-dom has no layout: recharts' ResponsiveContainer measures getBoundingClientRect and gets 0×0.
const originalRect = HTMLElement.prototype.getBoundingClientRect;
beforeAll(() => {
  // Only the container gets a size; text-measurement spans stay 0 wide so tick labels aren't culled as overlapping.
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    if (!this.classList.contains('recharts-responsive-container')) return originalRect.call(this);
    return { x: 0, y: 0, top: 0, left: 0, right: 640, bottom: 280, width: 640, height: 280, toJSON: () => ({}) };
  };
});
// Reduced motion: recharts animates bars and slices in from zero size, and happy-dom never advances frames.
const originalMatchMedia = window.matchMedia;
beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('reduce'),
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
});

afterAll(() => {
  HTMLElement.prototype.getBoundingClientRect = originalRect;
  window.matchMedia = originalMatchMedia;
});

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
  [...document.querySelectorAll('.recharts-cartesian-axis-tick-value')].map((node) => ({
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

describe('BarChart', () => {
  it('draws a bar per datum and series, horizontally on request', () => {
    const { rerender } = render(<BarChart aria-label="Revenue by clinic" data={data} series={series} x={{ key: 'day' }} />);
    expect(document.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(6);

    rerender(<BarChart aria-label="Revenue by clinic" data={data} series={series} x={{ key: 'day' }} orientation="horizontal" stacked />);
    expect(document.querySelector('.recharts-bar-rectangle path')?.getAttribute('fill')).toBe('var(--chart-1)');
  });
});

const visitTypes = [
  { type: 'In person', count: 62 },
  { type: 'Video', count: 23 },
  { type: 'Phone', count: 15 },
];

describe('DonutChart', () => {
  it('draws a slice per item with palette colours, a centre value and a slice table', () => {
    render(
      <DonutChart aria-label="Visits by type" data={visitTypes} nameKey="type" valueKey="count" centerLabel="Visits" centerValue="100" />,
    );
    const slices = [...document.querySelectorAll('.recharts-pie-sector path')];
    expect(slices).toHaveLength(3);
    expect(slices[1].getAttribute('fill')).toBe('var(--chart-2)');
    expect(screen.getByText('100')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'View as table' }));
    expect(screen.getByRole('cell', { name: 'In person' })).toBeTruthy();
    expect(screen.getByText('62').closest('td')).not.toBeNull();
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
