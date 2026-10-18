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
  it("has its own parts and never replaces Dialog's (both wrap the same Radix root)", () => {
    expect(Sheet).not.toBe(Dialog);
    expect(Sheet.Content).not.toBe(Dialog.Content);
    expect(Dialog.Content.displayName).toBe('DialogContent');
  });

  it('is a dialog named by its title, with a sticky footer for actions', () => {
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: 'Book' }));
    const sheet = screen.getByRole('dialog', { name: 'New appointment' });
    expect(sheet.querySelector('[data-slot="sheet-footer"]')?.textContent).toContain('Save');
    expect(sheet.className).toContain('rule-top-section');
    expect(sheet.className).toContain('data-[state=open]:duration-spring-long');
    expect(sheet.className).toContain('data-[state=closed]:duration-exit');
    expect(sheet.className).toContain('data-[state=closed]:ease-in');
    expect(sheet.querySelector('[data-slot="section-marker"]')).toBeNull();
    expect(sheet.querySelector('[data-slot="sheet-body"]')?.className).toContain('overflow-y-auto');
    // A grid or flex body must pack its content to the top instead of stretching rows to fill the height.
    expect(sheet.querySelector('[data-slot="sheet-body"]')?.className).toContain('content-start');
  });

  it('places side="end" with logical insets, so it opens on the left in Arabic', () => {
    render(<Example side="end" />);
    fireEvent.click(screen.getByRole('button', { name: 'Book' }));
    const classes = screen.getByRole('dialog').className;
    expect(classes).toContain('md:end-0');
    expect(classes).not.toMatch(/\b(md:)?(right|left)-0\b/);
  });

  it('slides up only as a bottom sheet; from md it slides in from its side, never from the bottom', () => {
    render(<Example side="end" />);
    fireEvent.click(screen.getByRole('button', { name: 'Book' }));
    const classes = screen.getByRole('dialog').className.split(/\s+/);
    // Unscoped bottom slides leak into the md side panel and add vertical travel (a diagonal slide from below).
    expect(classes.filter((name) => /slide-(in-from|out-to)-bottom/.test(name)).every((name) => name.startsWith('max-md:'))).toBe(true);
    expect(classes).toContain('md:data-[state=open]:slide-in-from-end');
  });

  it('springs in from its edge and leaves quickly; its body fields cascade in', () => {
    render(<Example side="end" />);
    fireEvent.click(screen.getByRole('button', { name: 'Book' }));
    const classes = screen.getByRole('dialog').className.split(/\s+/);
    expect(classes).toEqual(expect.arrayContaining(['data-[state=open]:duration-spring-long', 'data-[state=open]:ease-spring']));
    expect(classes).toEqual(expect.arrayContaining(['data-[state=closed]:duration-exit', 'data-[state=closed]:ease-in']));
    expect(classes).not.toContain('data-[state=open]:duration-slow');
    expect(document.querySelector('[data-slot="sheet-body"]')?.className).toContain('cascade');
  });

  it('ignores Escape when not dismissible', () => {
    render(<Example dismissible={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Book' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });
});
