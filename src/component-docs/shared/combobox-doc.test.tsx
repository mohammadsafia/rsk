// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { getComponentDocsRegistry } from '@component-docs/registry';
import { mdxComponents } from '@component-docs/gallery/utils';
import { MDXProvider } from '@mdx-js/react';

import '../../i18n';

afterEach(cleanup);

const renderDoc = async () => {
  const { default: Doc } = await getComponentDocsRegistry()
    .find((doc) => doc.id === 'combobox')!
    .load();
  render(
    <Tooltip.Provider>
      <MDXProvider components={mdxComponents}>
        <Doc />
      </MDXProvider>
    </Tooltip.Provider>,
  );
  return document.querySelector('[data-slot="combobox-value"]')!.closest('button') as HTMLElement;
};

describe('Combobox docs demo', () => {
  it('selects an option by click and shows it in the trigger', async () => {
    const trigger = await renderDoc();
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByRole('option', { name: /Lina Khoury/ }));
    await waitFor(() => expect(trigger.textContent).toContain('Dr. Lina Khoury'));
  });

  it('selects with the keyboard: arrows move, Enter picks', async () => {
    const trigger = await renderDoc();
    fireEvent.click(trigger);
    const search = await screen.findByPlaceholderText('Search doctors…');
    await waitFor(() => expect(document.activeElement).toBe(search));
    fireEvent.keyDown(search, { key: 'ArrowDown' });
    fireEvent.keyDown(search, { key: 'Enter' });
    await waitFor(() => expect(trigger.textContent).toContain('Dr. Omar Nasser'));
  });
});
