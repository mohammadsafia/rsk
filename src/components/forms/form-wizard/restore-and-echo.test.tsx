// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import { useForm, useWatch } from 'react-hook-form';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Tooltip } from '@components/ui';
import { FormCheckbox, FormInput, FormWizard } from '@components/forms';

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

const wrap = (ui: React.ReactNode, onUrlUpdate?: (event: UrlUpdateEvent) => void) => (
  <NuqsTestingAdapter hasMemory onUrlUpdate={onUrlUpdate}>
    <MemoryRouter>
      <Tooltip.Provider>{ui}</Tooltip.Provider>
    </MemoryRouter>
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
    await screen.findByRole('heading', { name: 'Contact' });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'Insurance' });
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(screen.getByRole('heading', { name: 'Insurance' })).toBeTruthy();
    await waitFor(() => expect(onUrlUpdate.mock.calls.at(-1)?.[0].searchParams.get('step')).toBe('insurance'));
    // Settled: no write storm.
    const writes = onUrlUpdate.mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(onUrlUpdate.mock.calls.length).toBe(writes);
  });
});
