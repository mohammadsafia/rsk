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
        <ConfirmDialog tone="success" title="Saved" onConfirm={() => Promise.reject(new Error('x'))}>
          <Button>Open</Button>
        </ConfirmDialog>
      </Tooltip.Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });
  it('carries tone through the icon and confirm button, without a colored stripe', () => {
    render(
      <Tooltip.Provider>
        <ConfirmDialog tone="danger" title="Delete record?" description="This can't be undone." open>
          {null}
        </ConfirmDialog>
      </Tooltip.Provider>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).not.toMatch(/border-t-/);
    expect(dialog.querySelector('svg.text-danger')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Confirm' }).dataset.tone).toBe('danger');
  });

  it('announces its description', () => {
    render(
      <Tooltip.Provider>
        <ConfirmDialog tone="warning" title="Leave?" description="Unsaved changes will be lost." open>
          {null}
        </ConfirmDialog>
      </Tooltip.Provider>,
    );
    const dialog = screen.getByRole('dialog');
    expect(document.getElementById(dialog.getAttribute('aria-describedby') ?? '')?.textContent).toBe('Unsaved changes will be lost.');
  });

  it('rejects the removed variant prop at compile time', () => {
    // @ts-expect-error — `variant` was replaced by `tone`
    const element = <ConfirmDialog variant="destructive" open />;
    expect(element).toBeTruthy();
  });
});
