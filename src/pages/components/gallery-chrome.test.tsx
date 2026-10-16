// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react';
import { act } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import ComponentDetailPage from './ComponentDetailPage';
import ComponentsGalleryPage from './ComponentsGalleryPage';

import i18n from '../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

const at = (path: string) =>
  render(
    <NuqsAdapter>
      <Tooltip.Provider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/components" element={<ComponentsGalleryPage />} />
            <Route path="/components/:id" element={<ComponentDetailPage />} />
          </Routes>
        </MemoryRouter>
      </Tooltip.Provider>
    </NuqsAdapter>,
  );

describe('docs gallery chrome', () => {
  it('gallery uses tokens and translated copy', async () => {
    await act(() => i18n.changeLanguage('ar'));
    const { container } = at('/components');
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    expect(container.innerHTML).not.toMatch(/primary-|muted-|text-foreground|bg-background|text-muted-foreground/);
    expect(container.textContent).not.toMatch(/Filter by tag|No components found|Loading documentation/);
  });

  it('detail page uses PageHeader with a breadcrumb, and EmptyState when the id is unknown', () => {
    at('/components/button');
    expect(screen.getByRole('heading', { level: 1, name: 'Button' }).closest('[data-slot="page-header"]')).not.toBeNull();
    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeTruthy();
    cleanup();

    at('/components/does-not-exist');
    expect(document.querySelector('[data-slot="empty-state"]')).not.toBeNull();
  });
});
