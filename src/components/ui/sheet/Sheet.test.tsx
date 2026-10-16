// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Button, Dialog, Sheet } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

const Example = ({ dismissible, side }: { dismissible?: boolean; side?: 'end' | 'start' }) => (
  <Sheet>
    <Sheet.Trigger asChild>
      <Button>Book</Button>
    </Sheet.Trigger>
    <Sheet.Content title="New appointment" description="Fri 16 Oct" side={side} dismissible={dismissible}>
      <Sheet.Body>
        <input aria-label="Patient" />
      </Sheet.Body>
      <Sheet.Footer>
        <Button>Save</Button>
      </Sheet.Footer>
    </Sheet.Content>
  </Sheet>
);

describe('Sheet', () => {
  it('has its own parts and never replaces Dialog\'s (both wrap the same Radix root)', () => {
    expect(Sheet).not.toBe(Dialog);
    expect(Sheet.Content).not.toBe(Dialog.Content);
    expect(Dialog.Content.displayName).toBe('DialogContent');
  });

  it('is a dialog named by its title, with a sticky footer for actions', () => {
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: 'Book' }));
    const sheet = screen.getByRole('dialog', { name: 'New appointment' });
    expect(sheet.querySelector('[data-slot="sheet-footer"]')?.textContent).toContain('Save');
    expect(sheet.querySelector('[data-slot="sheet-body"]')?.className).toContain('overflow-y-auto');
  });

  it('places side="end" with logical insets, so it opens on the left in Arabic', () => {
    render(<Example side="end" />);
    fireEvent.click(screen.getByRole('button', { name: 'Book' }));
    const classes = screen.getByRole('dialog').className;
    expect(classes).toContain('md:end-0');
    expect(classes).not.toMatch(/\b(md:)?(right|left)-0\b/);
  });

  it('ignores Escape when not dismissible', () => {
    render(<Example dismissible={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Book' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });
});
