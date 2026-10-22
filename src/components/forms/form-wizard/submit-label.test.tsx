// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Tooltip } from '@components/ui';
import { FormInput, FormWizard } from '@components/forms';
import { MemoryKitRouter } from '../../../lib/contexts/testing';

import '../../../i18n';

afterEach(cleanup);

function Wizard({ submitLabel }: { submitLabel?: string }) {
  const form = useForm({ defaultValues: { name: '' } });
  return (
    <MemoryKitRouter>
      <Tooltip.Provider>
        <FormWizard form={form} onSubmit={vi.fn()} submitLabel={submitLabel}>
          <FormWizard.Step id="one" title="One">
            <FormInput name="name" label="Name" />
          </FormWizard.Step>
          <FormWizard.Step id="two" title="Two">
            <p>Done</p>
          </FormWizard.Step>
        </FormWizard>
      </Tooltip.Provider>
    </MemoryKitRouter>
  );
}

describe('FormWizard submitLabel', () => {
  it('names the final button after what the form does', async () => {
    render(<Wizard submitLabel="Register patient" />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByRole('button', { name: 'Register patient' })).toBeTruthy();
  });

  it('defaults to Submit', async () => {
    render(<Wizard />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByRole('button', { name: 'Submit' })).toBeTruthy();
  });
});
