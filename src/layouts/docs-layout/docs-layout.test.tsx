// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { ThemeProvider } from '@contexts';
import { docsRoutes } from '@routes';
import { ReactRouterKitProvider } from '@routes/routerAdapter';

import i18n from '../../i18n';

afterEach(cleanup);

const at = (path: string) => {
  const router = createMemoryRouter(docsRoutes, { initialEntries: [path] });
  render(
    <ThemeProvider>
      <NuqsTestingAdapter>
        <Tooltip.Provider>
          <ReactRouterKitProvider>
            <RouterProvider router={router} />
          </ReactRouterKitProvider>
        </Tooltip.Provider>
      </NuqsTestingAdapter>
    </ThemeProvider>,
  );
  return router;
};

// The docs layout is lazy (dev-only chunk); warm its module graph once so each test only waits on rendering.
beforeAll(() => import('./DocsLayout'), 30_000);

describe('docs shell and routes', () => {
  it('renders a component page publicly with the docs top bar and grouped nav', async () => {
    at('/docs/components/button');
    expect(await screen.findByRole('heading', { level: 1, name: 'Button' })).toBeTruthy();
    expect(screen.getByRole('banner').querySelector('[data-slot="logo"]')).not.toBeNull();
    const nav = screen.getByRole('navigation', { name: 'Documentation' });
    expect(nav.textContent).toContain('Getting started');
    expect(screen.getByRole('link', { name: 'Button' }).getAttribute('aria-current')).toBe('page');
  });

  it('mounts a toaster so the toast demos on docs pages can show', async () => {
    at('/docs/components/toast');
    await screen.findByRole('heading', { level: 1, name: 'Toast' });
    expect(document.querySelector('[data-slot="toast-viewport"]')).not.toBeNull();
  });

  it('has one main landmark, with the article prose flush with its header and real heading/list styles', async () => {
    at('/docs');
    await screen.findByRole('heading', { level: 1, name: 'Introduction' });

    expect(screen.getAllByRole('main')).toHaveLength(1);
    const prose = document.querySelector('[data-slot="docs-prose"]')!;
    expect(prose.className).not.toMatch(/(^|\s)px-/);
    expect(prose.className).toMatch(/\[&>h2\]:/);
    expect(prose.className).toMatch(/\[&>ul\]:list-disc/);
  });

  it('in Arabic keeps the English article left to right, while examples preview right to left', async () => {
    await act(() => i18n.changeLanguage('ar'));
    at('/docs/components/button');
    await screen.findByRole('heading', { level: 1, name: 'Button' });

    const article = document.querySelector('article')!;
    expect(article.getAttribute('lang')).toBe('en');
    expect(article.getAttribute('dir')).toBe('ltr');
    expect(article.querySelector('[data-slot="docs-example-preview"]')?.getAttribute('dir')).toBe('rtl');
    await act(() => i18n.changeLanguage('en'));
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
