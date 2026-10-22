// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { z } from 'zod';

import { Tooltip } from '@components/ui';
import { FormInput, FormWizard } from '@components/forms';
import { MemoryKitRouter } from '../../../lib/contexts/testing';

import '../../../i18n';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

type Values = { name: string; phone: string; insurer: string; notes: string };

function Intake({ onSubmit = vi.fn() }: { onSubmit?: (values: Values) => void }) {
  const form = useForm<Values>({ defaultValues: { name: '', phone: '', insurer: '', notes: '' } });
  return (
    <MemoryKitRouter>
      <Tooltip.Provider>
        <FormWizard form={form} onSubmit={onSubmit}>
          <FormWizard.Step id="patient" title="Patient" schema={z.object({ name: z.string().min(1, 'Enter the name') })}>
            <FormInput name="name" label="Full name" />
          </FormWizard.Step>
          <FormWizard.Step id="contact" title="Contact" fields={['phone']}>
            <FormInput name="phone" label="Phone" rules={{ required: 'Enter a phone number' }} />
          </FormWizard.Step>
          <FormWizard.Step id="notes" title="Notes">
            <FormInput name="notes" label="Notes" />
          </FormWizard.Step>
        </FormWizard>
      </Tooltip.Provider>
    </MemoryKitRouter>
  );
}

const next = () => fireEvent.click(screen.getByRole('button', { name: 'Next' }));

describe('FormWizard navigation', () => {
  it('slides the next step in from the end and the previous one from the start, but not the first step', async () => {
    render(<Intake />);
    const step = () => document.querySelector<HTMLElement>('[data-slot="form-wizard-step"]')!;
    expect(step().hasAttribute('data-direction')).toBe(false);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sara' } });
    next();
    await screen.findByRole('heading', { name: 'Contact' });
    expect(step().dataset.direction).toBe('forward');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await screen.findByRole('heading', { name: 'Patient' });
    expect(step().dataset.direction).toBe('back');
  });

  it('shows one step at a time with a stepper, a caption and the step heading', () => {
    render(<Intake />);
    expect(screen.getByRole('heading', { name: 'Patient' })).toBeTruthy();
    expect(screen.queryByLabelText('Phone')).toBeNull();
    expect(screen.getByText('Step 1 of 3')).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Steps' }).querySelectorAll('li')).toHaveLength(3);
  });

  it('validates only the current step with its schema, showing the error and focusing the field', async () => {
    render(<Intake />);
    next();
    expect(await screen.findByText('Enter the name')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Patient' })).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Full name')));
  });

  it('moves on when valid, focuses the new heading and announces the step', async () => {
    render(<Intake />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sara Haddad' } });
    next();
    const heading = await screen.findByRole('heading', { name: 'Contact' });
    await waitFor(() => expect(document.activeElement).toBe(heading));
    expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe('Step 2 of 3, Contact');
  });

  it('validates a schema-less step through its listed fields', async () => {
    render(<Intake />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sara' } });
    next();
    await screen.findByRole('heading', { name: 'Contact' });
    next();
    expect(await screen.findByText('Enter a phone number')).toBeTruthy();
  });

  it('goes back without validating', async () => {
    render(<Intake />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sara' } });
    next();
    await screen.findByRole('heading', { name: 'Contact' });
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByRole('heading', { name: 'Patient' })).toBeTruthy();
    expect(screen.queryByText('Enter a phone number')).toBeNull();
  });

  it('lets completed steps be revisited from the stepper but keeps later ones locked', async () => {
    render(<Intake />);
    const stepButton = (name: string) => screen.getByRole('button', { name: new RegExp(name) });
    expect(stepButton('Contact').hasAttribute('disabled')).toBe(true);

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sara' } });
    next();
    await screen.findByRole('heading', { name: 'Contact' });
    fireEvent.click(stepButton('Patient'));
    expect(await screen.findByRole('heading', { name: 'Patient' })).toBeTruthy();
    expect(stepButton('Notes').hasAttribute('disabled')).toBe(true);
  });

  it('submits from the last step with the whole form', async () => {
    const onSubmit = vi.fn();
    render(<Intake onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sara' } });
    next();
    await screen.findByRole('heading', { name: 'Contact' });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '0790000000' } });
    next();
    await screen.findByRole('heading', { name: 'Notes' });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    });
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Sara', phone: '0790000000' })));
  });
});

type Intake2 = { name: string; insured: boolean; insurer: string; notes: string };

function ReviewHarness({ insured = true }: { insured?: boolean }) {
  const form = useForm<Intake2>({ defaultValues: { name: 'Sara Haddad', insured, insurer: '', notes: '' } });
  return (
    <MemoryKitRouter>
      <Tooltip.Provider>
        <FormWizard form={form} onSubmit={vi.fn()}>
          <FormWizard.Step id="patient" title="Patient" fields={['name']} review={[{ name: 'name', label: 'Full name' }]}>
            <FormInput name="name" label="Full name" />
          </FormWizard.Step>
          <FormWizard.Step id="insurance" title="Insurance" optional condition={insured} review={[{ name: 'insurer', label: 'Insurer' }]}>
            <FormInput name="insurer" label="Insurer" />
          </FormWizard.Step>
          <FormWizard.Review />
        </FormWizard>
      </Tooltip.Provider>
    </MemoryKitRouter>
  );
}

describe('FormWizard steps', () => {
  it('skips an optional step without validating it', async () => {
    render(<ReviewHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'Insurance' });
    expect(screen.getByText('Optional')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(await screen.findByRole('heading', { name: 'Review' })).toBeTruthy();
  });

  it('hides a step whose condition is false', () => {
    render(<ReviewHarness insured={false} />);
    expect(screen.getByText('Step 1 of 2')).toBeTruthy();
  });

  it('summarises every step with Edit links that jump back', async () => {
    render(<ReviewHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'Insurance' });
    fireEvent.change(screen.getByLabelText('Insurer'), { target: { value: 'Jordan Health Mutual' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'Review' });

    expect(screen.getByText('Full name').closest('dl')?.textContent).toContain('Sara Haddad');
    expect(screen.getByText('Jordan Health Mutual')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Edit Insurance' }));
    expect(await screen.findByRole('heading', { name: 'Insurance' })).toBeTruthy();
  });
});
