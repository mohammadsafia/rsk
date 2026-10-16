// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import DashboardPage from './DashboardPage';

import '../../i18n';

afterEach(cleanup);

describe('DashboardPage', () => {
  it('is built from PageHeader, CardGrid, Card and DescriptionList on tokens', () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' }).closest('[data-slot="page-header"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-slot="card-grid"]').length).toBeGreaterThan(0);
    expect(container.querySelector('[data-slot="description-list"]')).not.toBeNull();
    expect(container.querySelector('svg[role="img"] polyline')?.getAttribute('stroke')).toBe('var(--accent)');
    expect(container.innerHTML).not.toMatch(
      /text-foreground|text-muted-foreground|bg-primary|text-primary|text-destructive|var\(--primary\)/,
    );
  });

  it('isolates KPI values left-to-right', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    const value = document.querySelector('[data-slot="stat-value"]') as HTMLElement;
    expect(value.getAttribute('dir')).toBe('ltr');
    expect(value.className).toContain('tabular-nums');
  });
});
