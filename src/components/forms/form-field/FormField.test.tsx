// @vitest-environment happy-dom
import { type FieldError } from 'react-hook-form';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormField } from '@components/forms';
import { Tooltip } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

const renderField = (props: { error?: FieldError; description?: string; tooltip?: string; required?: boolean } = {}) =>
  render(
    <Tooltip.Provider>
      <FormField id="email" label="Email" {...props}>
        {({ invalid, ...control }) => <input aria-invalid={invalid || undefined} {...control} />}
      </FormField>
    </Tooltip.Provider>,
  );

const message = () => document.querySelectorAll('[data-slot="form-field-message"]');

describe('FormField', () => {
  it('links the description to the control', () => {
    renderField({ description: 'Use your work email' });
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(document.getElementById(input.getAttribute('aria-describedby')!)?.textContent).toBe('Use your work email');
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('replaces the description with the error in a single message line', () => {
    renderField({ description: 'Use your work email', error: { type: 'required', message: 'Email is required' } });
    expect(message()).toHaveLength(1);
    expect(message()[0].textContent).toBe('Email is required');
    expect(message()[0].className).toContain('text-danger');
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(message()[0].id);
  });

  it('keeps the tooltip button out of the label so the name stays exact', () => {
    renderField({ tooltip: 'We never share it', required: true });
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeTruthy();
    const info = screen.getByRole('button', { name: 'More information' });
    expect(info.closest('label')).toBeNull();
  });

  it('marks required controls and omits describedby when there is no message', () => {
    renderField({ required: true });
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.hasAttribute('aria-describedby')).toBe(false);
    expect(message()).toHaveLength(0);
  });
});
