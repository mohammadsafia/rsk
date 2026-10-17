// @vitest-environment happy-dom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormCombobox, FormMultiCombobox, FormSelect } from '@components/forms';

import { FormHarness } from '../../test-utils/FormHarness';

import i18n from '../../i18n';

afterEach(cleanup);

const OPTIONS = [{ label: 'Admin', value: 'admin' }];
const optionProps = {
  options: OPTIONS,
  getOptionLabel: (option: { label: string }) => option.label,
  getOptionValue: (option: { value: string }) => option.value,
};

const describedText = (element: HTMLElement) => document.getElementById(element.getAttribute('aria-describedby') ?? '')?.textContent;

describe('select-like fields', () => {
  it.each([
    ['FormSelect', <FormSelect key="s" name="role" label="Role" {...optionProps} />],
    ['FormCombobox', <FormCombobox key="c" name="role" label="Role" {...optionProps} />],
    ['FormMultiCombobox', <FormMultiCombobox key="m" name="role" label="Role" {...optionProps} />],
  ])('%s is labelled, invalid and described by its inline error', async (_name, field) => {
    render(
      <FormHarness defaultValues={{ role: null }} errors={{ role: 'Pick a role' }}>
        {field}
      </FormHarness>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Role' });
    await waitFor(() => expect(trigger.getAttribute('aria-invalid')).toBe('true'));
    expect(describedText(trigger)).toBe('Pick a role');
    expect(trigger.className).not.toMatch(/(^|\s)ps-8(\s|$)/);
  });
});

describe('select-like field defaults follow the language', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('en'));
  });

  it.each([
    ['FormSelect', <FormSelect key="s" name="role" label="Role" {...optionProps} />],
    ['FormCombobox', <FormCombobox key="c" name="role" label="Role" {...optionProps} />],
    ['FormMultiCombobox', <FormMultiCombobox key="m" name="role" label="Role" {...optionProps} />],
  ])('%s shows a translated placeholder when none is given', async (_, field) => {
    await act(() => i18n.changeLanguage('ar'));
    render(<FormHarness defaultValues={{ role: null }}>{field}</FormHarness>);
    expect(screen.getByRole('combobox', { name: 'Role' }).textContent).toContain('اختر');
    expect(document.body.textContent).not.toMatch(/Select/);
  });
});
