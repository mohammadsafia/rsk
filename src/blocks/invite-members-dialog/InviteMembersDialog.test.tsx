// @vitest-environment happy-dom
import { useState } from 'react';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Toaster } from '@components/shared';

import { type Invite, InviteMembersDialog } from './index';

import '../../i18n';

type InviteResult = { failed?: Record<string, string> } | void;

const ROLES = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
];

function Harness({ onInvite, defaultRole }: { onInvite: (invites: Invite[]) => Promise<InviteResult>; defaultRole?: string }) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <Toaster />
      <InviteMembersDialog open={open} onOpenChange={setOpen} roles={ROLES} defaultRole={defaultRole} onInvite={onInvite} />
    </>
  );
}

const setup = (onInvite = vi.fn(async (_invites: Invite[]): Promise<InviteResult> => undefined), defaultRole?: string) => {
  render(<Harness onInvite={onInvite} defaultRole={defaultRole} />);
  return { input: screen.getByRole('textbox', { name: 'Email addresses' }), onInvite };
};

const paste = (input: HTMLElement, text: string) => fireEvent.paste(input, { clipboardData: { getData: () => text } });
const chips = () => [...document.querySelectorAll('[data-slot="chip-input-chip"]')].map((chip) => chip.getAttribute('data-value'));
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Send invitations' }));

afterEach(cleanup);

describe('InviteMembersDialog', () => {
  it('turns pasted addresses into chips, without duplicates', () => {
    const { input } = setup();
    paste(input, 'a@x.com, b@x.com\nA@x.com');
    expect(chips()).toEqual(['a@x.com', 'b@x.com']);
  });

  it('makes a chip on comma or Enter, and Backspace in the empty input removes the last one', () => {
    const { input } = setup();
    fireEvent.change(input, { target: { value: 'a@x.com,' } });
    fireEvent.change(input, { target: { value: 'b@x.com' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(chips()).toEqual(['a@x.com', 'b@x.com']);
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(chips()).toEqual(['a@x.com']);
  });

  it('makes a chip from what the input shows on Enter, even before its change has rendered', () => {
    // A fast typist (or a browser that hasn't re-rendered yet): the input holds text React hasn't seen.
    const { input } = setup();
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'b@x.com');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(chips()).toEqual(['b@x.com']);
  });

  it('marks an invalid address and blocks sending with a message', async () => {
    const { input, onInvite } = setup();
    paste(input, 'a@x.com nope');
    const invalid = document.querySelector('[data-value="nope"]')!;
    expect(invalid.getAttribute('data-invalid')).toBe('true');
    expect(invalid.textContent).toContain('not a valid email address');
    submit();
    expect(await screen.findByText('Fix or remove the addresses marked as not valid.')).toBeTruthy();
    expect(onInvite).not.toHaveBeenCalled();
  });

  it('asks for at least one address', async () => {
    const { onInvite } = setup();
    submit();
    expect(await screen.findByText('Add at least one email address.')).toBeTruthy();
    expect(onInvite).not.toHaveBeenCalled();
  });

  it('sends every address with the chosen role', async () => {
    const { input, onInvite } = setup(undefined, 'admin');
    paste(input, 'a@x.com, b@x.com');
    submit();
    await waitFor(() =>
      expect(onInvite).toHaveBeenCalledWith([
        { email: 'a@x.com', role: 'admin' },
        { email: 'b@x.com', role: 'admin' },
      ]),
    );
  });

  it('keeps the dialog open with the failed address and its reason, and drops the ones sent', async () => {
    const { input } = setup(vi.fn(async () => ({ failed: { 'b@x.com': 'Already a member' } })));
    paste(input, 'a@x.com, b@x.com');
    // A real click leaves the focus on the send button.
    screen.getByRole('button', { name: 'Send invitations' }).focus();
    submit();
    // The reason shows in the alert, and is read with the address's chip.
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Already a member'));
    expect(document.querySelector('[data-value="b@x.com"]')!.textContent).toContain('Already a member');
    expect(chips()).toEqual(['b@x.com']);
    expect(document.querySelector('[data-value="b@x.com"]')!.getAttribute('data-invalid')).toBe('true');
    expect(screen.getByRole('dialog')).toBeTruthy();
    // Back in the addresses, ready to fix or resend (the send button was disabled while sending).
    await waitFor(() => expect(document.activeElement).toBe(input));
  });

  it('closes and confirms when every invitation is sent', async () => {
    const { input } = setup();
    paste(input, 'a@x.com, b@x.com');
    submit();
    expect(await screen.findByText('2 invitations sent')).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('says so when sending fails, and keeps every address', async () => {
    const { input } = setup(vi.fn(async () => Promise.reject(new Error('offline'))));
    paste(input, 'a@x.com');
    await act(async () => submit());
    expect(await screen.findByText('The invitations didn’t go out. Try again.')).toBeTruthy();
    expect(chips()).toEqual(['a@x.com']);
  });
});
