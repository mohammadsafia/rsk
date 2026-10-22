// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { ReactRouterKitProvider } from '@routes/routerAdapter';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { NotFound, SettingsPlaceholder } from './RoutePlaceholders';

import '../i18n';

afterEach(cleanup);

describe('route placeholders', () => {
  it('NotFound is a level-1 no-results state with a way home', () => {
    render(
      <ReactRouterKitProvider>
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      </ReactRouterKitProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to home' }).getAttribute('href')).toBe('/');
    expect(document.body.innerHTML).not.toMatch(/text-primary|text-foreground|text-muted-foreground/);
  });

  it('Settings uses the page header', () => {
    render(
      <ReactRouterKitProvider>
        <MemoryRouter>
          <SettingsPlaceholder />
        </MemoryRouter>
      </ReactRouterKitProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' }).closest('[data-slot="page-header"]')).not.toBeNull();
  });
});
