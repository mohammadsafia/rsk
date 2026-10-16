// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { StatCard } from '@components/shared';

import '../../../i18n';

afterEach(cleanup);

describe('StatCard', () => {
  it('shows the value and a signed trend whose label reads out direction and caption', () => {
    render(<StatCard label="Visits" value="248" trend={{ value: 12.4 }} caption="vs last week" />);
    expect(screen.getByText('248').closest('[dir="ltr"]')).not.toBeNull();
    const trend = screen.getByLabelText('Up 12.4% vs last week');
    expect(trend.className).toContain('text-success');
  });

  it('uses danger when the movement is against the positive direction', () => {
    render(<StatCard label="No-shows" value="3" trend={{ value: 8, positive: 'down' }} />);
    expect(screen.getByLabelText('Up 8%').className).toContain('text-danger');
  });

  it('reads a zero trend as "No change" in a neutral tone', () => {
    render(<StatCard label="Wait" value="14 min" trend={{ value: 0 }} />);
    const trend = screen.getByLabelText('No change 0%');
    expect(trend.className).toContain('text-fg-muted');
    expect(trend.className).not.toMatch(/text-(success|danger)/);
  });

  it('shows a skeleton while loading and becomes a link with href', () => {
    const { rerender } = render(<StatCard label="Visits" value="248" loading />);
    expect(screen.queryByText('248')).toBeNull();
    expect(document.querySelector('[data-slot="stat-card"] [aria-hidden="true"]')).not.toBeNull();

    rerender(
      <MemoryRouter>
        <StatCard label="Visits" value="248" href="/visits" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /Visits/ }).getAttribute('href')).toBe('/visits');
  });
});
