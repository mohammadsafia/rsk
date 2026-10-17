// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormRadioGroup, FormSelect } from '@components/forms';

import { FormHarness } from '../../test-utils/FormHarness';

import '../../i18n';

afterEach(cleanup);

const optionProps = {
  options: [{ label: 'Open', value: 'open' }],
  getOptionLabel: (option: { label: string }) => option.label,
  getOptionValue: (option: { value: string }) => option.value,
};

describe('field ids are unique per instance', () => {
  it('two fields with the same name on one page get different control ids', () => {
    render(
      <>
        <FormHarness defaultValues={{ status: null }}>
          <FormSelect name="status" label="Status" {...optionProps} />
          <FormRadioGroup name="status" label="State" {...optionProps} />
        </FormHarness>
        <FormHarness defaultValues={{ status: null }}>
          <FormSelect name="status" label="Status filter" {...optionProps} />
        </FormHarness>
      </>,
    );
    const first = screen.getByRole('combobox', { name: 'Status' });
    const second = screen.getByRole('combobox', { name: 'Status filter' });
    expect(first.id).not.toBe(second.id);
    expect(screen.getByRole('radiogroup', { name: 'State' }).id).not.toBe(first.id);
  });
});
