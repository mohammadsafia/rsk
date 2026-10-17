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

  it('tops the dialog with the section rule and marks its title with §', () => {
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
    expect(dialog.querySelector('[data-slot="dialog-title"] [data-slot="section-marker"]')?.textContent).toBe('§');
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

  it('a dialog opened inside Sections still shows §, and marker={false} removes it', () => {
    const { unmount } = render(
      <Sections>
        <Dialog defaultOpen>
          <Dialog.Content title="Edit patient" />
        </Dialog>
      </Sections>,
    );
    const edit = screen.getByRole('dialog', { name: 'Edit patient' });
    expect(edit.querySelector<HTMLElement>('[data-slot="section-marker"]')?.dataset.kind).toBe('section');
    unmount();

    render(
      <Sections>
        <Dialog defaultOpen>
          <Dialog.Content title="Delete patient" marker={false} />
        </Dialog>
      </Sections>,
    );
    expect(screen.getByRole('dialog', { name: 'Delete patient' }).querySelector('[data-slot="section-marker"]')).toBeNull();
  });
});
