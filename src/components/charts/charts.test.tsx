// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vite-plus/test';

import { AreaChart, LineChart } from '@components/charts';

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
afterAll(() => {
  HTMLElement.prototype.getBoundingClientRect = originalRect;
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
