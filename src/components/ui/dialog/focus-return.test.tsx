// @vitest-environment happy-dom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Button, Dialog, Sheet } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

/** A sheet or dialog opened by state, not by its Trigger: e.g. from a table row's action or after a request. */
const Example = ({ kind }: { kind: 'sheet' | 'dialog' }) => {
  const [open, setOpen] = useState(false);
  const Root = kind === 'sheet' ? Sheet : Dialog;
  const Content = kind === 'sheet' ? Sheet.Content : Dialog.Content;

  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit visit</Button>
      <Root open={open} onOpenChange={setOpen}>
        <Content title="Edit visit">
          <input aria-label="Reason" />
          {/* Closes by state, as a Cancel or a finished save does: not through Radix's Close. */}
          <Button onClick={() => setOpen(false)}>Cancel</Button>
        </Content>
      </Root>
    </>
  );
};

const openFromButton = async () => {
  const opener = screen.getByRole('button', { name: 'Edit visit' });
  opener.focus();
  fireEvent.click(opener);
  const dialog = await screen.findByRole('dialog', { name: 'Edit visit' });
  await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  return { opener, dialog };
};

describe.each(['sheet', 'dialog'] as const)('a %s opened by state', (kind) => {
  it('returns focus to the element that opened it after Escape', async () => {
    render(<Example kind={kind} />);
    const { opener, dialog } = await openFromButton();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(opener));
  });

  it('returns focus to the element that opened it after Cancel', async () => {
    render(<Example kind={kind} />);
    const { opener } = await openFromButton();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(opener));
  });

  it('returns focus to the element that opened it after its close button', async () => {
    render(<Example kind={kind} />);
    const { opener } = await openFromButton();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(opener));
  });
});

describe('focus return keeps what already worked', () => {
  it('a dialog opened by its Trigger still returns focus to the Trigger', async () => {
    render(
      <Dialog>
        <Dialog.Trigger asChild>
          <Button>Open</Button>
        </Dialog.Trigger>
        <Dialog.Content title="Edit visit">
          <input aria-label="Reason" />
        </Dialog.Content>
      </Dialog>,
    );
    const trigger = screen.getByRole('button', { name: 'Open' });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.keyDown(await screen.findByRole('dialog'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('a caller that prevents onCloseAutoFocus places focus itself', async () => {
    const Placed = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Edit visit</Button>
          <input aria-label="Search" />
          <Sheet open={open} onOpenChange={setOpen}>
            <Sheet.Content
              title="Edit visit"
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                (screen.getByRole('textbox', { name: 'Search' }) as HTMLInputElement).focus();
              }}
            >
              <input aria-label="Reason" />
            </Sheet.Content>
          </Sheet>
        </>
      );
    };
    render(<Placed />);
    const { dialog } = await openFromButton();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Search' })));
  });
});
