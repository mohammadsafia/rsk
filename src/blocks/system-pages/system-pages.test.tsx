// @vitest-environment happy-dom
import type { ReactNode } from 'react';

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { MaintenancePage, NoAccessPage, NotFoundPage, ServerErrorPage } from './index';

import i18n from '../../i18n';
import { type BlockMeta, generateBlockIndex } from '../../../scripts/kit/blocks';

afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  await act(() => i18n.changeLanguage('en'));
});

const renderAt = (element: ReactNode) => {
  const router = createMemoryRouter(
    [
      { path: '/', element: <p>Home page</p> },
      { path: '/page', element },
    ],
    { initialEntries: ['/page'] },
  );
  render(<RouterProvider router={router} />);
  return router;
};

describe('system pages', () => {
  it.each([
    ['NotFoundPage', <NotFoundPage key="404" />, 'Page not found'],
    ['ServerErrorPage', <ServerErrorPage key="500" />, 'Something went wrong on our side'],
    ['MaintenancePage', <MaintenancePage key="maint" />, 'We’ll be back soon'],
    ['NoAccessPage', <NoAccessPage key="403" />, 'You don’t have access to this page'],
  ])('%s has its title as the page heading and a working link home', async (_name, page, title) => {
    renderAt(page);
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: 'Back to home' }));
    expect(await screen.findByText('Home page')).toBeTruthy();
  });

  it('as a route’s error element, shows the server error and retries the route', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let fail = true;
    const router = createMemoryRouter([
      {
        path: '/',
        loader: () => {
          if (fail) throw new Error('database down');
          return null;
        },
        element: <p>Loaded</p>,
        errorElement: <ServerErrorPage />,
      },
    ]);
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Something went wrong on our side' })).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Loaded')).toBeTruthy();
  });

  it('shows the not-found page when the route error is a 404 response', async () => {
    const router = createMemoryRouter([
      {
        path: '/',
        loader: () => {
          throw new Response('Not here', { status: 404 });
        },
        element: <p>Loaded</p>,
        errorElement: <ServerErrorPage />,
      },
    ]);
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeTruthy();
  });

  it('reads in Arabic, right to left', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderAt(<NotFoundPage />);
    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('الصفحة غير موجودة');
    expect(heading.closest('[dir]')?.getAttribute('dir') ?? document.documentElement.dir).toBe('rtl');
  });

  it('its block.json routes generate a block index that names its pages', () => {
    const meta = JSON.parse(readFileSync(path.join(import.meta.dirname, 'block.json'), 'utf8')) as BlockMeta;
    const source = generateBlockIndex([meta]);
    expect(source).toContain("{ path: '/no-access', lazy: async () => ({ Component: (await import('./system-pages')).NoAccessPage }) }");
    expect(source.indexOf("path: '/maintenance'")).toBeLessThan(source.indexOf("path: '*'"));
    expect(source).toContain("export { ServerErrorPage as BlockErrorElement } from './system-pages';");
  });
});
