// @vitest-environment happy-dom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormInput, FormNumber, FormTextarea } from '@components/forms';

import { FormHarness } from '../../test-utils/FormHarness';

import '../../i18n';

afterEach(cleanup);

const describedText = (element: HTMLElement) => document.getElementById(element.getAttribute('aria-describedby') ?? '')?.textContent;

describe('text fields', () => {
  it('FormInput shows its error inline and links it', async () => {
    render(
      <FormHarness defaultValues={{ email: '' }} errors={{ email: 'Email is required' }}>
        <FormInput name="email" label="Email" description="Work email" />
      </FormHarness>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    await waitFor(() => expect(describedText(input)).toBe('Email is required'));
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.className).not.toMatch(/ps-8|destructive/);
  });

  it('FormTextarea renders the Textarea primitive with its error', async () => {
    render(
      <FormHarness defaultValues={{ notes: '' }} errors={{ notes: 'Add a note' }}>
        <FormTextarea name="notes" label="Notes" />
      </FormHarness>,
    );
    const textarea = screen.getByRole('textbox', { name: 'Notes' });
    await waitFor(() => expect(textarea.getAttribute('aria-invalid')).toBe('true'));
    expect(textarea.dataset.slot).toBe('textarea');
    expect(describedText(textarea)).toBe('Add a note');
  });

  it('FormNumber links its description while valid', () => {
    render(
      <FormHarness defaultValues={{ qty: null }}>
        <FormNumber name="qty" label="Quantity" description="Whole units only" />
      </FormHarness>,
    );
    const input = screen.getByRole('textbox', { name: 'Quantity' });
    expect(describedText(input)).toBe('Whole units only');
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });
});
