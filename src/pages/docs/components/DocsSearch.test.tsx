// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { getComponentDocsRegistry } from '@component-docs/registry';

import DocsSearch from './DocsSearch';
import { buildSearchIndex } from './docs-search-index';

import i18n from '../../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

const mount = () => {
  const router = createMemoryRouter([{ path: '*', element: <DocsSearch /> }], { initialEntries: ['/docs'] });
  render(
    <Tooltip.Provider>
      <RouterProvider router={router} />
    </Tooltip.Provider>,
  );
  return router;
};

describe('docs search', () => {
  it('indexes guides, components and their sections', () => {
    const index = buildSearchIndex(getComponentDocsRegistry());
    expect(index.some((item) => item.group === 'components' && item.title === 'Button')).toBe(true);
    expect(index.some((item) => item.group === 'sections' && item.href.startsWith('/docs/components/button#'))).toBe(true);
  });

  it('opens on ⌘K with focus in the field and navigates with the keyboard', async () => {
    const router = mount();
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    const input = await screen.findByRole('combobox');
    await waitFor(() => expect(document.activeElement).toBe(input));
    fireEvent.change(input, { target: { value: 'button' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(router.state.location.pathname).toBe('/docs/components/button'));
  });

  it('ignores Arabic diacritics', () => {
    const index = buildSearchIndex([
      {
        id: 'x',
        title: 'مُحَمَّد',
        description: '',
        category: 'UI',
        section: 'Components',
        headings: [],
        load: async () => ({ default: () => null }),
      },
    ]);
    expect(index[0].keywords).toContain('محمد');
  });
});
