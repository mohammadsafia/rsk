// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { ErrorBoundary } from '@layouts';

import '../../i18n';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const Boom = () => {
  throw new Error('boom');
};

describe('ErrorBoundary', () => {
  it('shows an error EmptyState as the page heading with recovery actions', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const router = createMemoryRouter([{ path: '/', element: <Boom />, errorElement: <ErrorBoundary /> }]);
    render(<RouterProvider router={router} />);

    const alert = await screen.findByRole('alert');
    expect(alert.getAttribute('data-kind')).toBe('error');
    expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');
    expect(document.body.innerHTML).not.toMatch(/destructive|text-foreground|bg-background/);
  });
});
