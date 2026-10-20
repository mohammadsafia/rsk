// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useFormContext } from 'react-hook-form';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormChipInput } from '@components/forms';

import { FormHarness } from '../../../test-utils/FormHarness';

import '../../../i18n';

afterEach(cleanup);

const describedText = (element: HTMLElement) => document.getElementById(element.getAttribute('aria-describedby') ?? '')?.textContent;

function Values() {
  const { watch } = useFormContext();

  return <output>{JSON.stringify(watch('tags'))}</output>;
}

describe('FormChipInput', () => {
  it('is labelled, shows its error inline, links it and exposes invalid', async () => {
    render(
      <FormHarness defaultValues={{ tags: [] }} errors={{ tags: 'Add a tag' }}>
        <FormChipInput name="tags" label="Tags" description="Press Enter after each" />
      </FormHarness>,
    );
    const input = screen.getByRole('textbox', { name: 'Tags' });
    await waitFor(() => expect(describedText(input)).toBe('Add a tag'));
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('keeps the form value as the list of chips', () => {
    render(
      <FormHarness defaultValues={{ tags: ['react'] }}>
        <FormChipInput name="tags" label="Tags" />
        <Values />
      </FormHarness>,
    );
    fireEvent.paste(screen.getByRole('textbox', { name: 'Tags' }), { clipboardData: { getData: () => 'vite, oxc' } });
    expect(screen.getByRole('status').textContent).toBe('["react","vite","oxc"]');
  });
});
