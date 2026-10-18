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

  it('never shows a scrollbar for the underline: nothing overflows the list vertically and its scrollbar is hidden', () => {
    render(
      <Tabs defaultValue="a">
        <Tabs.List aria-label="Sections">
          <Tabs.Trigger value="a">A</Tabs.Trigger>
          <Tabs.Trigger value="b">B</Tabs.Trigger>
        </Tabs.List>
      </Tabs>,
    );
    const list = screen.getByRole('tablist', { name: 'Sections' });
    expect(list.className).toContain('overflow-y-hidden');
    expect(list.className).toContain('scrollbar-none');
    // The active underline sits inside the trigger (it used to hang 1px below and overflow the list).
    expect(screen.getByRole('tab', { name: 'A' }).className).not.toContain('-bottom-px');
  });

  it('marks the active tab with the ink bar, keeps aria-selected, and sets triggers in small caps', () => {
    renderTabs();
    const active = screen.getByRole('tab', { name: 'Notes' });
    expect(active.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tablist').querySelector('[data-slot="ink-bar"]')).not.toBeNull();
    expect(active.className).toContain('smallcaps');
    expect(active.className).not.toContain('after:bg-accent');
  });
});
