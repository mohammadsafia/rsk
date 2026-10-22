// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { StatCard } from '@components/shared';
import { MemoryKitRouter } from '../../../lib/contexts/testing';

import '../../../i18n';

afterEach(cleanup);

const trendFor = (text: string) => screen.getByText(text).closest('[data-slot="stat-card-trend"]') as HTMLElement;

describe('StatCard', () => {
  it('shows the value and a signed trend whose label reads out direction and caption', () => {
    render(<StatCard label="Visits" value="248" trend={{ value: 12.4 }} caption="vs last week" />);
    expect(screen.getByText('248').closest('[dir="ltr"]')).not.toBeNull();
    const trend = trendFor('Up 12.4% vs last week');
    expect(trend.className).toContain('text-success');
  });

  it('announces the trend as real text, not an aria-label on a generic span', () => {
    render(<StatCard label="Visits" value="248" trend={{ value: 12.4 }} caption="vs last week" />);
    const trend = document.querySelector('[data-slot="stat-card-trend"]')!;
    expect(trend.getAttribute('aria-label')).toBeNull();
    expect(screen.getByText('Up 12.4% vs last week').className).toContain('sr-only');
  });

  it('uses danger when the movement is against the positive direction', () => {
    render(<StatCard label="No-shows" value="3" trend={{ value: 8, positive: 'down' }} />);
    expect(trendFor('Up 8%').className).toContain('text-danger');
  });

  it('reads a zero trend as "No change" in a neutral tone', () => {
    render(<StatCard label="Wait" value="14 min" trend={{ value: 0 }} />);
    const trend = trendFor('No change 0%');
    expect(trend.className).toContain('text-fg-muted');
    expect(trend.className).not.toMatch(/text-(success|danger)/);
  });

  it('shows a skeleton while loading and becomes a link with href', () => {
    const { rerender } = render(<StatCard label="Visits" value="248" loading />);
    expect(screen.queryByText('248')).toBeNull();
    expect(document.querySelector('[data-slot="stat-card"] [aria-hidden="true"]')).not.toBeNull();

    rerender(
      <MemoryKitRouter>
        <StatCard label="Visits" value="248" href="/visits" />
      </MemoryKitRouter>,
    );
    expect(screen.getByRole('link', { name: /Visits/ }).getAttribute('href')).toBe('/visits');
  });

  it('rolls a string or number value, keeping its accessible text', () => {
    render(<StatCard label="Visits" value="248" />);
    expect(document.querySelector('[data-slot="rolling-text"]')).not.toBeNull();
    expect(screen.getByText('248').className).toContain('sr-only');
  });

  it('pops the trend when it changes, never on first paint', () => {
    const animate = vi.fn();
    Element.prototype.animate = animate as unknown as typeof Element.prototype.animate;
    const { rerender } = render(<StatCard label="Visits" value="248" trend={{ value: 12.4 }} />);
    expect(animate).not.toHaveBeenCalled();
    rerender(<StatCard label="Visits" value="251" trend={{ value: 13.1 }} />);
    expect(animate).toHaveBeenCalledTimes(1);
  });

  it("doesn't pop on mount under StrictMode, whose dev remount replays the effect", () => {
    const animate = vi.fn();
    Element.prototype.animate = animate as unknown as typeof Element.prototype.animate;
    const { rerender } = render(
      <StrictMode>
        <StatCard label="Visits" value="248" trend={{ value: 12.4 }} />
      </StrictMode>,
    );
    expect(animate).not.toHaveBeenCalled();
    rerender(
      <StrictMode>
        <StatCard label="Visits" value="251" trend={{ value: 13.1 }} />
      </StrictMode>,
    );
    expect(animate).toHaveBeenCalledTimes(1);
  });
});
