// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Tooltip } from '@components/ui';
import { FormInput, FormWizard } from '@components/forms';
import { MemoryKitRouter } from '../../../lib/contexts/testing';

import '../../../i18n';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

type Values = { name: string; phone: string; photo: File | null };

const KEY = 'rsk:wizard:intake';
const stored = () => JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as { values: Partial<Values>; step: number } | null;

function DraftHarness({ onSubmit = vi.fn() }: { onSubmit?: (values: Values) => void }) {
  const form = useForm<Values>({ defaultValues: { name: '', phone: '', photo: null } });

  useEffect(() => {
    form.setValue('photo', new File(['x'], 'id.png', { type: 'image/png' }));
  }, [form]);

  return (
    <MemoryKitRouter>
      <Tooltip.Provider>
        <FormWizard form={form} onSubmit={onSubmit} draftKey="intake">
          <FormWizard.Step id="patient" title="Patient" fields={['name']}>
            <FormInput name="name" label="Full name" />
          </FormWizard.Step>
          <FormWizard.Step id="contact" title="Contact">
            <FormInput name="phone" label="Phone" />
          </FormWizard.Step>
        </FormWizard>
      </Tooltip.Provider>
    </MemoryKitRouter>
  );
}

describe('FormWizard draft', () => {
  it('saves values, but never files, to sessionStorage', async () => {
    render(<DraftHarness />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sara' } });
    await waitFor(() => expect(stored()?.values.name).toBe('Sara'), { timeout: 2000 });
    expect(stored()?.values.photo).toBeUndefined();
  });

  it('restores a draft with a notice; Discard resets the form and removes it', async () => {
    sessionStorage.setItem(KEY, JSON.stringify({ values: { name: 'Omar' }, step: 0 }));
    render(<DraftHarness />);
    expect(await screen.findByText('Draft restored from your last visit.')).toBeTruthy();
    expect((screen.getByLabelText('Full name') as HTMLInputElement).value).toBe('Omar');

    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect((screen.getByLabelText('Full name') as HTMLInputElement).value).toBe(''));
    expect(sessionStorage.getItem(KEY)).toBeNull();
    expect(screen.queryByText('Draft restored from your last visit.')).toBeNull();
  });

  it('ignores and removes corrupt draft JSON', () => {
    sessionStorage.setItem(KEY, '{not json');
    render(<DraftHarness />);
    expect(screen.queryByText('Draft restored from your last visit.')).toBeNull();
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('clears the draft after a successful submit', async () => {
    const onSubmit = vi.fn();
    render(<DraftHarness onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sara' } });
    await waitFor(() => expect(stored()?.values.name).toBe('Sara'), { timeout: 2000 });

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'Contact' });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    });
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    await waitFor(() => expect(sessionStorage.getItem(KEY)).toBeNull(), { timeout: 2000 });
  });
});
