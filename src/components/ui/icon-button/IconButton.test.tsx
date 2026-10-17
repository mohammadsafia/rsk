// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { IconButton, Tooltip } from '@components/ui';

afterEach(cleanup);

const Icon = () => <svg aria-hidden="true" />;

/** Compile-time contract: `tsc -b` fails if aria-label stops being required. Never executed. */
export const iconButtonTypeContract = () => (
  <>
    {/* @ts-expect-error aria-label is required */}
    <IconButton>
      <Icon />
    </IconButton>
  </>
);

describe('IconButton', () => {
  it('is a square ghost button named by aria-label', () => {
    render(
      <Tooltip.Provider>
        <IconButton aria-label="Delete">
          <Icon />
        </IconButton>
      </Tooltip.Provider>,
    );
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button.dataset.slot).toBe('icon-button');
    expect(button.dataset.variant).toBe('ghost');
    expect(button.className).toContain('w-control-md');
  });

  it('shows its label as a tooltip on keyboard focus', async () => {
    render(
      <Tooltip.Provider delayDuration={0}>
        <IconButton aria-label="Duplicate">
          <Icon />
        </IconButton>
      </Tooltip.Provider>,
    );
    fireEvent.focus(screen.getByRole('button', { name: 'Duplicate' }));
    expect((await screen.findByRole('tooltip')).textContent).toContain('Duplicate');
  });

  it('asChild renders the child element instead of a nested button', () => {
    render(
      <button type="button">
        Field
        <IconButton asChild tooltip={false} aria-label="Clear">
          <span>×</span>
        </IconButton>
      </button>,
    );
    const clear = screen.getByLabelText('Clear');
    expect(clear.tagName).toBe('SPAN');
    expect(clear.closest('button')?.textContent).toContain('Field');
  });
});
