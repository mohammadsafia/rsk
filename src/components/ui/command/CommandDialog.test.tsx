// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Command, Tooltip } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

describe('Command.Dialog', () => {
  it('labels its input by the dialog title and names the list in the app language', () => {
    render(
      <Tooltip.Provider>
        <Command.Dialog title="Command palette" open>
          <Command.Input placeholder="Search" />
          <Command.List>
            <Command.Item>Dashboard</Command.Item>
          </Command.List>
        </Command.Dialog>
      </Tooltip.Provider>,
    );
    expect(screen.getByRole('combobox', { name: 'Command palette' })).toBeTruthy();
    expect(screen.getByRole('listbox', { name: 'Suggestions' })).toBeTruthy();
  });
});
