// @vitest-environment happy-dom
// The Vite block index feeds the system-pages error page from React Router: a failed loader shows the server error and
// "Try again" re-runs it; a 404 response shows the not-found page. Generated from the block's own block.json.
import { createElement, type FC, Suspense } from 'react';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

import { type BlockMeta, generateBlockIndex } from '../../scripts/kit/blocks';

import '../../src/i18n';

const ROOT = path.resolve(import.meta.dirname, '../..');
const GENERATED = path.join(import.meta.dirname, '.block-index.generated.ts');

let BlockErrorElement: FC;

beforeAll(async () => {
  const meta = JSON.parse(readFileSync(path.join(ROOT, 'src/blocks/system-pages/block.json'), 'utf8')) as BlockMeta;
  writeFileSync(GENERATED, generateBlockIndex([meta]).replaceAll("'./system-pages'", "'@blocks/system-pages'"));
  ({ BlockErrorElement } = (await import(GENERATED)) as { BlockErrorElement: FC });
  // Warm the lazy page, so the first render isn't timed against the module's first transform.
  await import('@blocks/system-pages');
});

afterAll(() => rmSync(GENERATED, { force: true }));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const errorElement = () => createElement(Suspense, null, createElement(BlockErrorElement));

describe('generated BlockErrorElement (Vite)', () => {
  it('shows the server error for a failed route and retries it', async () => {
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
        errorElement: errorElement(),
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
        errorElement: errorElement(),
      },
    ]);
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeTruthy();
  });
});
