// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { ConfirmDialog } from '@components/shared';
import { Button, Tooltip } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

describe('ConfirmDialog', () => {
  it('always offers a close button, even when Escape and outside clicks are blocked', () => {
    render(
      <Tooltip.Provider>
        <ConfirmDialog variant="success" title="Saved" onConfirm={() => Promise.reject(new Error('x'))}>
          <Button>Open</Button>
        </ConfirmDialog>
      </Tooltip.Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });
});
