// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Combobox } from '@components/shared';

afterEach(cleanup);

describe('Combobox.Trigger', () => {
  it('uses the field shape at md and exposes invalid', () => {
    render(
      <Combobox>
        <Combobox.Trigger invalid>
          <Combobox.Value placeholder="Choose a doctor" />
        </Combobox.Trigger>
      </Combobox>,
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger.className).toContain('h-control-md');
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.className).not.toMatch(/bg-background|border-muted-200/);
  });

  it('focuses the search field when it opens', async () => {
    render(
      <Combobox>
        <Combobox.Trigger>Doctor</Combobox.Trigger>
        <Combobox.Content>
          <Combobox.Input placeholder="Search doctors" />
          <Combobox.List>
            <Combobox.Item value="lina">Dr. Lina Khoury</Combobox.Item>
          </Combobox.List>
        </Combobox.Content>
      </Combobox>,
    );
    fireEvent.click(screen.getByText('Doctor').closest('button') as HTMLElement);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByPlaceholderText('Search doctors')));
  });

  it('takes its visible text as its name when no label is given (role=combobox is not named by content)', () => {
    render(
      <Combobox>
        <Combobox.Trigger>Status</Combobox.Trigger>
      </Combobox>,
    );
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeTruthy();
  });

  it('keeps an explicit label', () => {
    render(
      <Combobox>
        <Combobox.Trigger aria-label="Invoice status">Paid</Combobox.Trigger>
      </Combobox>,
    );
    expect(screen.getByRole('combobox', { name: 'Invoice status' })).toBeTruthy();
  });
});
