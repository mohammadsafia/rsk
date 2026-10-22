// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { ThemeProvider } from '@contexts';
import { ReactRouterKitProvider } from '@routes/routerAdapter';

import HomePage from './HomePage';

import i18n from '../../i18n';

afterEach(async () => {
  cleanup();
  vi.unstubAllEnvs();
  await act(() => i18n.changeLanguage('en'));
});

const renderHome = () =>
  render(
    <ThemeProvider>
      <Tooltip.Provider>
        <ReactRouterKitProvider>
          <MemoryRouter>
            <HomePage />
          </MemoryRouter>
        </ReactRouterKitProvider>
      </Tooltip.Provider>
    </ThemeProvider>,
  );

describe('HomePage', () => {
  it('links to the docs in development', () => {
    renderHome();
    expect(document.querySelector('a[href^="/docs"]')).not.toBeNull();
  });

  it('keeps the docs out of a production build: no docs links, no docs showcase, stats still filled', () => {
    vi.stubEnv('DEV', false);
    renderHome();

    expect(document.querySelector('a[href^="/docs"]')).toBeNull();
    expect(screen.queryByText('Open Gallery')).toBeNull();
    for (const value of document.querySelectorAll('[data-slot="landing-stat-value"]')) {
      expect(Number(value.textContent)).toBeGreaterThan(0);
    }
  });

  it('has a sticky nav with the logo lockup and one level-1 heading with the accent word', () => {
    renderHome();
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(nav.closest('header')?.className).toContain('sticky');
    expect(nav.closest('header')?.querySelector('[data-slot="logo"]')).not.toBeNull();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.querySelector('.text-accent')?.textContent).toBe('next');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('shows registry counts in mono LTR stat cells', () => {
    renderHome();
    const cells = [...document.querySelectorAll('[data-slot="landing-stat"] [data-slot="landing-stat-value"]')];
    expect(cells).toHaveLength(4);
    cells.forEach((cell) => {
      expect(cell.getAttribute('dir')).toBe('ltr');
      expect(cell.className).toContain('font-mono');
      expect(Number(cell.textContent)).toBeGreaterThan(0);
    });
  });

  it('uses the Kufi-friendly leading on Arabic headings and no legacy classes', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderHome();
    expect(screen.getByRole('heading', { level: 1 }).className).toMatch(/rtl:leading-snug|leading-snug/);
    expect(screen.getByRole('heading', { level: 1 }).className).toContain('rtl:tracking-normal');
    expect(document.body.innerHTML).not.toMatch(/text-muted-foreground|bg-primary|text-primary(?!-)|\[\d+px\]|tracking-\[/);
  });
});
