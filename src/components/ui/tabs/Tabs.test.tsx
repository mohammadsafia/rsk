// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tabs } from '@components/ui';

afterEach(cleanup);

const renderTabs = (listProps: { variant?: 'underline' | 'contained'; fullWidth?: boolean } = {}) =>
  render(
    <Tabs defaultValue="notes">
      <Tabs.List {...listProps}>
        <Tabs.Trigger value="notes">Notes</Tabs.Trigger>
        <Tabs.Trigger value="files">Files</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="notes">Notes body</Tabs.Content>
      <Tabs.Content value="files">Files body</Tabs.Content>
    </Tabs>,
  );

describe('Tabs', () => {
  it('defaults to underline, not full width', () => {
    renderTabs();
    const list = screen.getByRole('tablist');
    expect(list.dataset.variant).toBe('underline');
    expect(list.dataset.fullWidth).toBe('false');
  });

  it('exposes contained + fullWidth for styling', () => {
    renderTabs({ variant: 'contained', fullWidth: true });
    const list = screen.getByRole('tablist');
    expect(list.dataset.variant).toBe('contained');
    expect(list.dataset.fullWidth).toBe('true');
  });

  it('switches panels with the keyboard', async () => {
    renderTabs();
    const notes = screen.getByRole('tab', { name: 'Notes' });
    notes.focus();
    fireEvent.keyDown(notes, { key: 'ArrowRight' });
    // Radix roving focus moves focus in a timeout, so wait for activation.
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Files' }).getAttribute('data-state')).toBe('active'));
  });
});
