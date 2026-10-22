// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import { useForm, useWatch } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { z } from 'zod';

import { Tooltip } from '@components/ui';
import { FormCheckbox, FormInput, FormWizard } from '@components/forms';
import { MemoryKitRouter } from '../../../lib/contexts/testing';

import '../../../i18n';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

type Values = { name: string; insured: boolean; insurer: string; notes: string };

function Wizard({ urlSync = false, draftKey }: { urlSync?: boolean; draftKey?: string }) {
  const form = useForm<Values>({ defaultValues: { name: '', insured: false, insurer: '', notes: '' } });
  const insured = useWatch({ control: form.control, name: 'insured' });
  return (
    <FormWizard form={form} onSubmit={vi.fn()} urlSync={urlSync} draftKey={draftKey}>
      <FormWizard.Step id="patient" title="Patient">
        <FormInput name="name" label="Name" />
        <FormCheckbox name="insured" control={form.control} label="Insured" />
      </FormWizard.Step>
      <FormWizard.Step id="contact" title="Contact">
        <FormInput name="notes" label="Notes" />
      </FormWizard.Step>
      <FormWizard.Step id="insurance" title="Insurance" condition={insured}>
        <FormInput name="insurer" label="Insurer" />
      </FormWizard.Step>
      <FormWizard.Step id="done" title="Done">
        <p>Done</p>
      </FormWizard.Step>
    </FormWizard>
  );
}

const wrap = (ui: React.ReactNode, onUrlUpdate?: (event: UrlUpdateEvent) => void, rateLimitFactor = 0) => (
  <NuqsTestingAdapter hasMemory onUrlUpdate={onUrlUpdate} rateLimitFactor={rateLimitFactor}>
    <MemoryKitRouter>
      <Tooltip.Provider>{ui}</Tooltip.Provider>
    </MemoryKitRouter>
  </NuqsTestingAdapter>
);

describe('FormWizard draft restore onto a conditional step', () => {
  it('opens the saved step even when that step only exists because of restored values', async () => {
    sessionStorage.setItem(
      'rsk:wizard:intake',
      JSON.stringify({
        values: { name: 'Huda', insured: true, insurer: '', notes: '' },
        stepId: 'insurance',
        completed: ['patient', 'contact'],
      }),
    );
    render(wrap(<Wizard draftKey="intake" />));
    expect(await screen.findByRole('heading', { name: 'Insurance' })).toBeTruthy();
  });
});

describe('FormWizard URL sync never chases its own writes', () => {
  it('lands on the step the user reached when Next is pressed quickly, with the URL matching', async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    render(wrap(<Wizard urlSync />, onUrlUpdate));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Insured' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'Contact' }, { timeout: 3000 });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'Insurance' }, { timeout: 3000 });
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(screen.getByRole('heading', { name: 'Insurance' })).toBeTruthy();
    await waitFor(() => expect(onUrlUpdate.mock.calls.at(-1)?.[0].searchParams.get('step')).toBe('insurance'));
    // Settled: no write storm.
    const writes = onUrlUpdate.mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(onUrlUpdate.mock.calls.length).toBe(writes);
  });
});

describe('FormWizard URL sync with a slow URL', () => {
  it('ignores a late echo of its own earlier write instead of jumping back', async () => {
    // rateLimitFactor makes the adapter flush URL writes late, as a busy browser does: the "contact" write
    // can land after the wizard has already moved on to Insurance.
    render(wrap(<Wizard urlSync />, undefined, 10));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Insured' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'Contact' });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'Insurance' });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(screen.getByRole('heading', { name: 'Insurance' })).toBeTruthy();
  });
});

describe('FormWizard skipped optional steps', () => {
  it('submits after an optional step with a required schema is skipped', async () => {
    const onSubmit = vi.fn();
    function SkipWizard() {
      const form = useForm({ defaultValues: { name: 'Huda', insurer: '' } });
      return (
        <FormWizard form={form} onSubmit={onSubmit}>
          <FormWizard.Step id="patient" title="Patient">
            <FormInput name="name" label="Name" />
          </FormWizard.Step>
          <FormWizard.Step
            id="insurance"
            title="Insurance"
            optional
            schema={z.object({ insurer: z.string().min(1, 'Choose the insurer') })}
          >
            <FormInput name="insurer" label="Insurer" />
          </FormWizard.Step>
          <FormWizard.Step id="done" title="Done">
            <p>Done</p>
          </FormWizard.Step>
        </FormWizard>
      );
    }
    render(wrap(<SkipWizard />));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'Insurance' });
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    await screen.findByRole('heading', { name: 'Done' });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(screen.queryByText('Choose the insurer')).toBeNull();
  });
});
