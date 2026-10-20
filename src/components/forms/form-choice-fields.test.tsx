// @vitest-environment happy-dom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormCheckbox, FormCheckboxGroup, FormRadioGroup } from '@components/forms';

import { FormHarness } from '../../test-utils/FormHarness';

import '../../i18n';

afterEach(cleanup);

const OPTIONS = [
  { label: 'Pollen', value: 'pollen' },
  { label: 'Dust', value: 'dust' },
];
const optionProps = {
  options: OPTIONS,
  getOptionLabel: (option: { label: string }) => option.label,
  getOptionValue: (option: { value: string }) => option.value,
};

const describedText = (element: HTMLElement) => document.getElementById(element.getAttribute('aria-describedby') ?? '')?.textContent;

describe('choice fields', () => {
  it('FormCheckbox is named by its card label, once, and described by its error', async () => {
    render(
      <FormHarness defaultValues={{ agree: false }} errors={{ agree: 'You must agree' }}>
        <FormCheckbox name="agree" label="I agree to the terms" />
      </FormHarness>,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'I agree to the terms' });
    await waitFor(() => expect(checkbox.getAttribute('aria-invalid')).toBe('true'));
    expect(describedText(checkbox)).toBe('You must agree');
    expect(screen.getAllByText('I agree to the terms')).toHaveLength(1);
  });

  it('FormCheckboxGroup is a named, described group whose checkboxes are invalid', async () => {
    render(
      <FormHarness defaultValues={{ allergies: [] }} errors={{ allergies: 'Pick at least one' }}>
        <FormCheckboxGroup name="allergies" label="Allergies" {...optionProps} />
      </FormHarness>,
    );
    const group = screen.getByRole('group', { name: 'Allergies' });
    // aria-invalid isn't supported on role="group" (ARIA 1.2): each checkbox carries it.
    await waitFor(() => expect(group.getAttribute('data-invalid')).toBe('true'));
    expect(group.getAttribute('aria-invalid')).toBeNull();
    for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox.getAttribute('aria-invalid')).toBe('true');
    expect(describedText(group)).toBe('Pick at least one');
  });

  it('FormRadioGroup is a named radiogroup with unique item ids', async () => {
    render(
      <FormHarness defaultValues={{ blood: '' }} errors={{ blood: 'Pick one' }}>
        <FormRadioGroup name="blood" label="Blood group" {...optionProps} />
      </FormHarness>,
    );
    const group = screen.getByRole('radiogroup', { name: 'Blood group' });
    await waitFor(() => expect(group.getAttribute('aria-invalid')).toBe('true'));
    expect(describedText(group)).toBe('Pick one');
    const ids = screen.getAllByRole('radio').map((radio) => radio.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('FormCheckbox shows its tooltip and required marker without leaking either into the name or the DOM', () => {
    render(
      <FormHarness defaultValues={{ agree: false }}>
        <FormCheckbox name="agree" label="I agree to the terms" tooltip="Why we ask" required />
      </FormHarness>,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'I agree to the terms' });
    expect(checkbox.hasAttribute('tooltip')).toBe(false);
    const info = screen.getByRole('button', { name: 'More information' });
    expect(info.closest('label')).toBeNull();
    expect(document.querySelector('[data-slot="form-checkbox-label"] [aria-hidden="true"]')?.textContent).toBe('*');
  });

  it('FormCheckbox is a plain inline choice: the box before its label, no field-like card', () => {
    render(
      <FormHarness defaultValues={{ agree: true }}>
        <FormCheckbox name="agree" label="The patient has insurance" />
      </FormHarness>,
    );
    const label = document.querySelector<HTMLElement>('[data-slot="form-checkbox-label"]')!;
    expect(label.className).not.toMatch(/\bborder\b|\bp-3\b|\brounded-lg\b|\bbg-surface\b|accent/);
    expect(label.className).toContain('min-h-control-sm');
    expect(label.firstElementChild?.getAttribute('role')).toBe('checkbox');
  });

  it('FormCheckboxGroup never puts aria-required on its role=group (not allowed there)', () => {
    render(
      <FormHarness defaultValues={{ allergies: [] }}>
        <FormCheckboxGroup name="allergies" label="Allergies" required {...optionProps} />
      </FormHarness>,
    );
    const group = screen.getByRole('group', { name: /Allergies/ });
    expect(group.hasAttribute('aria-required')).toBe(false);
  });
});
