// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Button, Dialog, Sections } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

const Example = ({ dismissible }: { dismissible?: boolean }) => (
  <Dialog>
    <Dialog.Trigger asChild>
      <Button>Open</Button>
    </Dialog.Trigger>

    <Dialog.Content title="Edit patient" description="Changes save immediately." dismissible={dismissible}>
      <input aria-label="Name" />
    </Dialog.Content>
  </Dialog>
);

describe('Dialog', () => {
  it('requires a title', () => {
    // @ts-expect-error — Dialog.Content without a title must not compile
    const content = <Dialog.Content>Body</Dialog.Content>;
    expect(content).toBeTruthy();
  });

  it('cascades its parts in, and only the opening rise steps aside for a flight (the exit always plays)', () => {
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    const className = screen.getByRole('dialog').className;
    expect(className).toContain('cascade');
    expect(className).toContain('data-[flight]:data-[state=open]:animate-none');
    expect(className).toContain('data-[state=closed]:animate-out');
  });

  it('is named by its title and described by its description', () => {
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit patient' });
    const describedBy = dialog.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(describedBy)?.textContent).toBe('Changes save immediately.');
  });

  it('moves focus in on open and back to the trigger on close', async () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    trigger.focus();
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true));
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('renders a labelled close button when dismissible (default)', () => {
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });

  it('dismissible={false} ignores Escape and outside pointer-down and renders no close button', () => {
    render(<Example dismissible={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    fireEvent.pointerDown(document.body);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('tops the dialog with the section rule, with no marker before the title', () => {
    render(
      <Dialog>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content title="Edit patient" description="Changes save immediately." />
      </Dialog>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit patient' });
    expect(dialog.className).toContain('rule-top');
    expect(dialog.className).toContain('rule-top-section');
    expect(dialog.className).toContain('data-[state=open]:duration-base');
    expect(dialog.className).toContain('data-[state=closed]:duration-fast');
    expect(dialog.className).toContain('data-[state=open]:slide-in-from-bottom-2');
    expect(dialog.className).not.toContain('duration-slow');
    expect(dialog.querySelector('[data-slot="section-marker"]')).toBeNull();
    expect(dialog.querySelector('[data-slot="dialog-title"]')?.textContent).toBe('Edit patient');
  });

  it('keeps the accessible name without the marker', () => {
    render(
      <Dialog>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content title="Edit patient" />
      </Dialog>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('dialog', { name: 'Edit patient' })).toBeTruthy();
  });

  it('a dialog opened inside a numbered Sections page shows no stray number', () => {
    render(
      <Sections>
        <Dialog defaultOpen>
          <Dialog.Content title="Edit patient" />
        </Dialog>
      </Sections>,
    );
    expect(screen.getByRole('dialog', { name: 'Edit patient' }).querySelector('[data-slot="section-marker"]')).toBeNull();
  });

  it('scrolls an inner body, so the heavy rule and the title stay put in long dialogs', () => {
    render(
      <Dialog defaultOpen>
        <Dialog.Content title="Edit patient">
          <p>Body</p>
        </Dialog.Content>
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Edit patient' });
    expect(dialog.className).not.toContain('overflow-y-auto');
    expect(dialog.className).toContain('overflow-hidden');
    const body = dialog.querySelector<HTMLElement>('[data-slot="dialog-body"]')!;
    expect(body.className).toContain('overflow-y-auto');
    expect(body.textContent).toBe('Body');
    expect(body.contains(dialog.querySelector('[data-slot="dialog-header"]'))).toBe(false);
  });
});
