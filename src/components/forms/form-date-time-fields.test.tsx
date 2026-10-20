// @vitest-environment happy-dom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormDatePicker, FormDateRange, FormTimePicker } from '@components/forms';

import { FormHarness } from '../../test-utils/FormHarness';

import '../../i18n';

afterEach(cleanup);

const describedText = (element: HTMLElement) => document.getElementById(element.getAttribute('aria-describedby') ?? '')?.textContent;

describe('date and time fields', () => {
  it('FormDatePicker links its inline error to the date input', async () => {
    render(
      <FormHarness defaultValues={{ visit: null }} errors={{ visit: 'Pick a visit date' }}>
        <FormDatePicker name="visit" label="Visit" />
      </FormHarness>,
    );
    const input = screen.getByRole('textbox', { name: 'Visit' });
    await waitFor(() => expect(describedText(input)).toBe('Pick a visit date'));
    const shell = input.closest('[data-slot="date-picker-container"]') as HTMLElement;
    expect(shell.className).not.toMatch(/(^|\s)ps-8(\s|$)/);
  });

  it('FormDateRange links its inline error to the range input', async () => {
    render(
      <FormHarness defaultValues={{ stay: null }} errors={{ stay: 'Pick the stay dates' }}>
        <FormDateRange name="stay" label="Stay" />
      </FormHarness>,
    );
    const input = screen.getByRole('textbox', { name: 'Stay' });
    await waitFor(() => expect(describedText(input)).toBe('Pick the stay dates'));
  });

  it('FormTimePicker describes its trigger with the inline error', async () => {
    render(
      <FormHarness defaultValues={{ time: null }} errors={{ time: 'Pick a time' }}>
        <FormTimePicker name="time" label="Time" />
      </FormHarness>,
    );
    const trigger = screen.getByRole('combobox', { name: /Time|Select time/ });
    await waitFor(() => expect(describedText(trigger)).toBe('Pick a time'));
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
  });

  it('a disabled date shell takes the field disabled look, not opacity', () => {
    render(
      <FormHarness defaultValues={{ visit: null }}>
        <FormDatePicker name="visit" label="Visit" disabled />
      </FormHarness>,
    );
    const shell = document.querySelector('[data-slot="date-picker-container"]') as HTMLElement;
    expect(shell.dataset.disabled).toBe('true');
    expect(shell.className).toContain('data-disabled:bg-surface-sunken');
    expect(shell.className).not.toContain('opacity-50');
  });
});
