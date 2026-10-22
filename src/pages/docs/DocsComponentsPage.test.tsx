// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { getComponentDocsRegistry, normalizeCategoryKey } from '@component-docs/registry';
import { ReactRouterKitProvider } from '@routes/routerAdapter';

import DocsComponentsPage from './DocsComponentsPage';

import '../../i18n';

afterEach(cleanup);

const mount = (search = '') =>
  render(
    <NuqsTestingAdapter searchParams={search}>
      <Tooltip.Provider>
        <ReactRouterKitProvider>
          <MemoryRouter>
            <DocsComponentsPage />
          </MemoryRouter>
        </ReactRouterKitProvider>
      </Tooltip.Provider>
    </NuqsTestingAdapter>,
  );

const componentDocs = () =>
  getComponentDocsRegistry().filter((doc) => !['GUIDES', 'FOUNDATIONS'].includes(normalizeCategoryKey(doc.category)));

describe('components overview', () => {
  it('renders a card for every component doc, each with a thumbnail or the category glyph', () => {
    mount();
    const cards = document.querySelectorAll('[data-slot="docs-card"]');
    expect(cards).toHaveLength(componentDocs().length);
    cards.forEach((card) => expect(card.querySelector('[data-slot="docs-card-thumb"]')?.children.length).toBeGreaterThan(0));
    expect(document.querySelectorAll('[data-slot="docs-card-thumb"][data-fallback]').length).toBeLessThan(cards.length);
  });

  it('filters by category chip', () => {
    mount('?category=forms');
    const cards = document.querySelectorAll('[data-slot="docs-card"]');
    expect(cards.length).toBe(componentDocs().filter((doc) => normalizeCategoryKey(doc.category) === 'FORMS').length);
    fireEvent.click(screen.getByRole('button', { name: /^All/ }));
    expect(document.querySelectorAll('[data-slot="docs-card"]')).toHaveLength(componentDocs().length);
  });

  it('keeps thumbnails out of the accessibility tree and focus order', () => {
    mount();
    document.querySelectorAll('[data-slot="docs-card-thumb"]').forEach((thumb) => {
      expect(thumb.getAttribute('aria-hidden')).toBe('true');
      expect(thumb.hasAttribute('inert')).toBe(true);
    });
  });
});
