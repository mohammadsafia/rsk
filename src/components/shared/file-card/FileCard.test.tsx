// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FileCard } from '@components/shared';
import { Tooltip } from '@components/ui';

import i18n from '../../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

describe('FileCard parts', () => {
  it('pluralises the folder count noun per language', async () => {
    render(<FileCard.FolderShape count={1} />);
    expect(screen.getByText('document')).toBeTruthy();
    cleanup();

    await act(() => i18n.changeLanguage('ar'));
    render(<FileCard.FolderShape count={2} />);
    expect(screen.getByText('مستند')).toBeTruthy();
  });

  it('translates the default approve and reject labels', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(
      <>
        <FileCard.Approve />
        <FileCard.Reject />
      </>,
    );
    expect(screen.getByRole('button', { name: 'اعتماد' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'رفض' })).toBeTruthy();
  });

  it('opens the assignee list as a popover under the name, not stretched across the screen', async () => {
    const people = [
      { id: 'sa', name: 'Sarah Johnson' },
      { id: 'da', name: 'David Chen' },
    ];
    render(
      <QueryClientProvider client={new QueryClient()}>
        <Tooltip.Provider>
          <FileCard.Assignee
            options={people}
            value={people[1]}
            getOptionLabel={(person) => person.name}
            getOptionValue={(person) => person.id}
            onChange={() => {}}
          />
        </Tooltip.Provider>
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole('combobox'));
    const list = (await screen.findByRole('listbox')).closest<HTMLElement>('[data-slot="popover-content"]')!;
    // The available width is all the room the screen has; as a width it fills the screen, so it only caps.
    expect(list.className).not.toMatch(/(^|\s)w-\(--radix-popover-content-available-width\)/);
    expect(list.className).toContain('max-w-(--radix-popover-content-available-width)');
  });
});
