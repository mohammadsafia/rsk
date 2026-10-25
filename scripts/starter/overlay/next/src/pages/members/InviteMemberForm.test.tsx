// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { MEMBERS_QUERY_KEY } from '@api/handlers/members';

import { renderWithKitRouter } from '../../lib/contexts/testing';
import InviteMemberForm from './InviteMemberForm';
import type { InviteResult } from './inviteSchema';

import '../../i18n';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderForm(answer: InviteResult | Error) {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  const invite = vi.fn(async () => {
    if (answer instanceof Error) throw answer;
    return answer;
  });
  const onDone = vi.fn();
  renderWithKitRouter(
    <QueryClientProvider client={client}>
      <Tooltip.Provider>
        <InviteMemberForm open invite={invite} onOpenChange={(open) => !open && onDone()} />
      </Tooltip.Provider>
    </QueryClientProvider>,
  );
  return { invite, invalidate, onDone };
}

const fill = (name: string, email: string) => {
  fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: email } });
};
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Send invite' }));

describe('InviteMemberForm', () => {
  it('checks the fields in the browser first, without calling the server', async () => {
    const { invite } = renderForm({ ok: true, member: { id: '1', name: 'A', email: 'a@example.com', role: 'member', joinedAt: '' } });
    submit();
    expect(await screen.findByText('Enter a name.')).toBeTruthy();
    expect(invite).not.toHaveBeenCalled();
  });

  it("shows the server's field error under its field", async () => {
    renderForm({ ok: false, fieldErrors: { email: 'That email is already a member.' } });
    fill('Layla', 'layla.haddad@example.com');
    submit();
    const message = await screen.findByText('That email is already a member.');
    const email = screen.getByLabelText(/^Email/);
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(email.getAttribute('aria-describedby')).toContain(message.id);
  });

  it('shows a form error from the server', async () => {
    renderForm({ ok: false, formError: 'Sign in again to invite someone.' });
    fill('Rana', 'rana@example.com');
    submit();
    expect(await screen.findByText('Sign in again to invite someone.')).toBeTruthy();
  });

  it("says the invite didn't go through when the action can't be reached", async () => {
    renderForm(new Error('Failed to find Server Action'));
    fill('Rana', 'rana@example.com');
    submit();
    expect(await screen.findByText("The invite didn't go through. Try again.")).toBeTruthy();
  });

  it('closes and refreshes the members table once the member is added', async () => {
    const { invite, invalidate, onDone } = renderForm({
      ok: true,
      member: { id: '24', name: 'Rana', email: 'rana@example.com', role: 'member', joinedAt: '2026-10-25T00:00:00.000Z' },
    });
    fill('Rana', 'rana@example.com');
    submit();
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(invite).toHaveBeenCalledWith('en', { name: 'Rana', email: 'rana@example.com', role: 'member' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: MEMBERS_QUERY_KEY });
  });
});
