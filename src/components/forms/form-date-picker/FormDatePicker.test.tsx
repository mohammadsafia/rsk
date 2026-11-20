// @vitest-environment happy-dom
import { type ReactNode, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { FormDatePicker, FormDateRange } from '@components/forms';
import { Tooltip } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

const WithError = ({ children }: { children: ReactNode }) => {
  const methods = useForm({ defaultValues: { visit: null, stay: null } });
  useEffect(() => {
    methods.setError('visit', { message: 'Required' });
    methods.setError('stay', { message: 'Required' });
  }, [methods]);
  return (
    <Tooltip.Provider>
      <FormProvider {...methods}>{children}</FormProvider>
    </Tooltip.Provider>
  );
};

const shells = () => [...document.querySelectorAll<HTMLElement>('[data-slot="date-picker-container"], [data-slot="date-range-container"]')];

describe('date field shells', () => {
  it('match the Input field height and expose the error on the shell and the input', async () => {
    render(
      <WithError>
        <FormDatePicker name="visit" label="Visit" />
        <FormDateRange name="stay" label="Stay" />
      </WithError>,
    );
    await waitFor(() => expect(shells().every((shell) => shell.getAttribute('aria-invalid') === 'true')).toBe(true));
    for (const shell of shells()) {
      expect(shell.className).toContain('h-control-md');
      expect(shell.className).not.toMatch(/h-12|border-destructive|bg-background/);
      expect(shell.querySelector('input')?.getAttribute('aria-invalid')).toBe('true');
    }
    expect(screen.getAllByRole('button', { name: 'Open calendar' }).length).toBe(2);
  });
});

const Plain = ({ children }: { children: ReactNode }) => {
  const methods = useForm({ defaultValues: { visit: null, stay: null } });
  return (
    <Tooltip.Provider>
      <FormProvider {...methods}>{children}</FormProvider>
    </Tooltip.Provider>
  );
};

describe('date field calendars', () => {
  // A fixed clock in December: without an end month the dropdown calendar stopped at December of the current year.
  it.each([
    ['FormDatePicker', () => <FormDatePicker name="visit" label="Visit" />],
    ['FormDateRange', () => <FormDateRange name="stay" label="Stay" />],
  ])('%s goes past December of this year, and its calendar opens from the keyboard', async (_, field) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date(2026, 11, 15, 10, 0));
      render(<Plain>{field()}</Plain>);
      const open = screen.getByRole('button', { name: /calendar/i });
      expect(open.tabIndex).not.toBe(-1);
      open.focus();
      fireEvent.click(open);
      const next = await screen.findByRole('button', { name: /next/i });
      expect(next.hasAttribute('disabled') || next.getAttribute('aria-disabled') === 'true').toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
