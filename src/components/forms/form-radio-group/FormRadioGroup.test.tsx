// @vitest-environment happy-dom
import { useForm } from 'react-hook-form';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormContainer, FormRadioGroup } from '@components/forms';

import '../../../i18n';

afterEach(cleanup);

const OPTIONS = [
  { label: 'Female', value: 'f' },
  { label: 'Male', value: 'm' },
];

const Example = () => {
  const form = useForm({ defaultValues: { choice: 'f' } });
  return (
    <FormContainer formContext={form} onSuccess={() => undefined}>
      <FormRadioGroup name="choice" label="Choice" options={OPTIONS} getOptionLabel={(o) => o.label} getOptionValue={(o) => o.value} />
    </FormContainer>
  );
};

describe('FormRadioGroup', () => {
  it('lays options out inline with the control before its label', () => {
    render(<Example />);
    const female = screen.getByRole('radio', { name: 'Female' });
    expect(female.firstElementChild?.getAttribute('data-slot')).toMatch(/indicator/);
    expect(female.textContent).toBe('Female');
    expect(female.className).not.toContain('flex-1');
    expect(female.parentElement?.className).toContain('gap-x-6');
  });
});
