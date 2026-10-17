// @vitest-environment happy-dom
import { type ReactNode, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormInput, FormSelect } from '@components/forms';
import { Tooltip } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

const WithError = ({ children }: { children: ReactNode }) => {
  const methods = useForm({ defaultValues: { email: '', role: '' } });
  useEffect(() => {
    methods.setError('email', { message: 'Required' });
    methods.setError('role', { message: 'Required' });
  }, [methods]);
  return (
    <Tooltip.Provider>
      <FormProvider {...methods}>{children}</FormProvider>
    </Tooltip.Provider>
  );
};

describe('form field invalid state', () => {
  it('FormInput marks an errored input aria-invalid without legacy hover overrides', async () => {
    render(
      <WithError>
        <FormInput name="email" label="Email" />
      </WithError>,
    );
    const input = screen.getByRole('textbox', { name: /email/i });
    await waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
    expect(input.className).not.toMatch(/border-destructive/);
  });

  it('FormSelect marks an errored trigger aria-invalid without legacy hover overrides', async () => {
    render(
      <WithError>
        <FormSelect
          name="role"
          label="Role"
          options={[{ label: 'Admin', value: 'admin' }]}
          getOptionLabel={(option) => option.label}
          getOptionValue={(option) => option.value}
        />
      </WithError>,
    );
    const trigger = screen.getByRole('combobox');
    await waitFor(() => expect(trigger.getAttribute('aria-invalid')).toBe('true'));
    expect(trigger.className).not.toMatch(/border-destructive/);
  });
});
