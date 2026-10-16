// @vitest-environment happy-dom
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { clinicStore } from '@api/clinic';

import i18n from '../../../i18n';
import { renderClinic, resetClinic } from '../test-utils';
import OperationsDashboard from './OperationsDashboard';

beforeEach(() => {
  resetClinic();
  // recharts' ResponsiveContainer measures its parent; happy-dom has no layout.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(DOMRect.fromRect({ width: 600, height: 240 }));
});
afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  clinicStore.setClock(null);
  await act(() => i18n.changeLanguage('en'));
});

const renderPage = (route = '/dashboard') => renderClinic(<OperationsDashboard />, { route, path: '/dashboard' });

describe('OperationsDashboard', () => {
  it('shows four stat cards with values for the last 30 days by default', async () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Operations' })).toBeTruthy();
    const visits = await screen.findByRole('link', { name: /^Visits/ });
    expect(visits.getAttribute('href')).toBe('/schedule?view=agenda');
    const total = clinicStore
      .read()
      .metrics.slice(-30)
      .reduce((sum, row) => sum + row.visits, 0);
    await waitFor(() => expect(visits.textContent).toContain(total.toLocaleString('en')));
    expect(screen.getByRole('link', { name: /New patients/ }).getAttribute('href')).toBe('/patients?sort=created');
    expect(screen.getByRole('link', { name: /Revenue/ }).getAttribute('href')).toBe('/billing');
  });

  it('switches the range and hides trends without a previous range', async () => {
    renderPage('/dashboard?range=90');
    const visits = await screen.findByRole('link', { name: /^Visits/ });
    const total = clinicStore.read().metrics.reduce((sum, row) => sum + row.visits, 0);
    await waitFor(() => expect(visits.textContent).toContain(total.toLocaleString('en')));
    expect(visits.querySelector('[data-slot="stat-card-trend"]')).toBeNull();
  });

  it("lists today's upcoming visits with links to the patients", async () => {
    renderPage();
    const today = await screen.findByRole('region', { name: "Today's visits" });
    const upcoming = clinicStore
      .read()
      .visits.filter((v) => v.start.startsWith('2026-10-16') && (v.status === 'scheduled' || v.status === 'arrived'));
    await waitFor(() => expect(within(today).getAllByRole('link').length).toBeGreaterThanOrEqual(Math.min(upcoming.length, 6)));
  });

  it('shows an error with Retry when metrics fail, and recovers', async () => {
    clinicStore.failNext('listMetrics');
    renderPage();
    const alert = await screen.findByRole('alert');
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('link', { name: /^Visits/ })).toBeTruthy();
  });

  it('renders in Arabic with Western digits', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderPage();
    expect(await screen.findByRole('heading', { level: 1, name: 'العمليات' })).toBeTruthy();
    await screen.findAllByRole('link');
    expect(document.body.textContent).not.toMatch(/[٠-٩]/);
  });
});
