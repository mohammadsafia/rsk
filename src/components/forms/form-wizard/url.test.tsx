// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Tooltip } from '@components/ui';
import { FormInput, FormWizard } from '@components/forms';
import { MemoryKitRouter } from '../../../lib/contexts/testing';

import '../../../i18n';

afterEach(cleanup);

type Values = { name: string; phone: string };

function Wizard({ urlSync }: { urlSync?: boolean }) {
  const form = useForm<Values>({ defaultValues: { name: '', phone: '' } });
  return (
    <FormWizard form={form} onSubmit={vi.fn()} urlSync={urlSync}>
      <FormWizard.Step id="patient" title="Patient" fields={['name']}>
        <FormInput name="name" label="Full name" rules={{ required: 'Enter the name' }} />
      </FormWizard.Step>
      <FormWizard.Step id="contact" title="Contact">
        <FormInput name="phone" label="Phone" />
      </FormWizard.Step>
    </FormWizard>
  );
}

const renderAt = (search: string, onUrlUpdate: (event: UrlUpdateEvent) => void, urlSync = true) =>
  render(
    <NuqsTestingAdapter searchParams={search} onUrlUpdate={onUrlUpdate}>
      <MemoryKitRouter>
        <Tooltip.Provider>
          <Wizard urlSync={urlSync} />
        </Tooltip.Provider>
      </MemoryKitRouter>
    </NuqsTestingAdapter>,
  );

describe('FormWizard URL sync', () => {
  it('writes ?step=<id> as the wizard moves', async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    renderAt('', onUrlUpdate);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sara' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'Contact' });
    await waitFor(() => expect(onUrlUpdate.mock.calls.at(-1)?.[0].searchParams.get('step')).toBe('contact'));
  });

  it('opens a locked step from the URL on the first incomplete step instead', async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    renderAt('?step=contact', onUrlUpdate);
    expect(await screen.findByRole('heading', { name: 'Patient' })).toBeTruthy();
    await waitFor(() => expect(onUrlUpdate.mock.calls.at(-1)?.[0].searchParams.get('step')).toBe('patient'));
  });

  it('never touches the URL without urlSync', async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    renderAt('', onUrlUpdate, false);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sara' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'Contact' });
    expect(onUrlUpdate).not.toHaveBeenCalled();
  });
});
