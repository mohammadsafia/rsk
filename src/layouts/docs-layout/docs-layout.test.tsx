// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { ThemeProvider } from '@contexts';
import { docsRoutes } from '@routes';

import '../../i18n';

afterEach(cleanup);

const at = (path: string) => {
  const router = createMemoryRouter(docsRoutes, { initialEntries: [path] });
  render(
    <ThemeProvider>
      <NuqsTestingAdapter>
        <Tooltip.Provider>
          <RouterProvider router={router} />
        </Tooltip.Provider>
      </NuqsTestingAdapter>
    </ThemeProvider>,
  );
  return router;
};

describe('docs shell and routes', () => {
  it('renders a component page publicly with the docs top bar and grouped nav', async () => {
    at('/docs/components/button');
    expect(await screen.findByRole('heading', { level: 1, name: 'Button' })).toBeTruthy();
    expect(screen.getByRole('banner').querySelector('[data-slot="logo"]')).not.toBeNull();
    const nav = screen.getByRole('navigation', { name: 'Documentation' });
    expect(nav.textContent).toContain('Getting started');
    expect(screen.getByRole('link', { name: 'Button' }).getAttribute('aria-current')).toBe('page');
  });

  it('redirects the old gallery links', async () => {
    const router = at('/components/button');
    await screen.findByRole('heading', { level: 1, name: 'Button' });
    expect(router.state.location.pathname).toBe('/docs/components/button');
  });

  it('shows the docs not-found page for an unknown id', async () => {
    at('/docs/components/nope');
    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Browse components' }).getAttribute('href')).toBe('/docs/components');
  });

  it('renders the introduction at /docs', async () => {
    at('/docs');
    expect(await screen.findByRole('heading', { level: 1, name: 'Introduction' })).toBeTruthy();
  });

  it('shows the outline and prev/next, and scrolls a #section link into view', async () => {
    const scrolled: string[] = [];
    vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(function (this: Element) {
      scrolled.push(this.id);
    });
    at('/docs/components/button#choosing-variant-and-tone');
    await screen.findByRole('heading', { level: 1, name: 'Button' });
    expect(await screen.findByRole('navigation', { name: 'On this page' })).toBeTruthy();
    expect(document.querySelector('[data-slot="docs-prev-next"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="docs-import"] code')?.textContent).toBe("import { Button } from '@components/ui';");
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(scrolled).toContain('choosing-variant-and-tone');
    vi.restoreAllMocks();
  });
});
