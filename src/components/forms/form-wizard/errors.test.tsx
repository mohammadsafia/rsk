// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { z } from 'zod';

import { Tooltip } from '@components/ui';
import { FormInput, FormWizard, FormWizardError } from '@components/forms';
import { MemoryKitRouter } from '../../../lib/contexts/testing';

import '../../../i18n';

afterEach(cleanup);

type Values = { name: string; insurer: string; phone: string };

function Harness({
  onSubmit,
  insured = true,
  onCancel,
  rejectName = false,
}: {
  onSubmit: (values: Values) => void | Promise<void>;
  insured?: boolean;
  onCancel?: () => void;
  rejectName?: boolean;
}) {
  const form = useForm<Values>({
    defaultValues: { name: 'Sara', insurer: 'JHM', phone: '0790000000' },
    resolver: rejectName
      ? zodResolver(z.object({ name: z.string().min(10, 'Use the full legal name'), insurer: z.string(), phone: z.string() }))
      : undefined,
  });
  return (
    <MemoryKitRouter>
      <Tooltip.Provider>
        <FormWizard form={form} onSubmit={onSubmit} onCancel={onCancel}>
          {/* With rejectName, a lenient step schema owns `name` and passes Next; the stricter resolver rejects at submit. */}
          <FormWizard.Step
            id="patient"
            title="Patient"
            fields={['name']}
            schema={rejectName ? z.object({ name: z.string().min(1) }) : undefined}
          >
            <FormInput name="name" label="Full name" />
          </FormWizard.Step>
          <FormWizard.Step id="insurance" title="Insurance" fields={['insurer']} condition={insured}>
            <FormInput name="insurer" label="Insurer" />
          </FormWizard.Step>
          <FormWizard.Step id="contact" title="Contact" fields={['phone']}>
            <FormInput name="phone" label="Phone" />
          </FormWizard.Step>
        </FormWizard>
      </Tooltip.Provider>
    </MemoryKitRouter>
  );
}

const toLastStep = async (steps: number) => {
  for (let index = 0; index < steps - 1; index += 1) {
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('button', { name: index === steps - 2 ? 'Submit' : 'Next' });
  }
};

const submit = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
  });
};

describe('FormWizard submit errors', () => {
  it('routes a server field error back to its step and marks that step in error', async () => {
    const onSubmit = vi.fn(async () => {
      throw new FormWizardError({ insurer: 'Unknown insurer' });
    });
    render(<Harness onSubmit={onSubmit} />);
    await toLastStep(3);
    await submit();

    expect(await screen.findByRole('heading', { name: 'Insurance' })).toBeTruthy();
    expect(await screen.findByText('Unknown insurer')).toBeTruthy();
    const insuranceStep = screen.getByRole('button', { name: /Insurance/ });
    expect(insuranceStep.querySelector('svg.text-danger')).not.toBeNull();
  });

  it('jumps to the first invalid step when the resolver rejects at submit', async () => {
    render(<Harness onSubmit={vi.fn()} rejectName />);
    await toLastStep(3);
    await submit();
    expect(await screen.findByRole('heading', { name: 'Patient' })).toBeTruthy();
    expect(await screen.findByText('Use the full legal name')).toBeTruthy();
  });

  it('shows a form-level alert when the errored field belongs to a hidden step', async () => {
    const onSubmit = vi.fn(async () => {
      throw new FormWizardError({ insurer: 'Unknown insurer' });
    });
    render(<Harness onSubmit={onSubmit} insured={false} />);
    await toLastStep(2);
    await submit();

    expect(screen.getByRole('heading', { name: 'Contact' })).toBeTruthy();
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Some details need attention before you can submit.');
    expect(alert.textContent).toContain('Unknown insurer');
  });
});

describe('FormWizard cancel', () => {
  it('cancels straight away on a pristine form', () => {
    const onCancel = vi.fn();
    render(<Harness onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('asks before discarding a dirty form', async () => {
    const onCancel = vi.fn();
    render(<Harness onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sara Haddad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(await screen.findByRole('dialog', { name: 'Discard unsaved changes?' })).toBeTruthy();
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(onCancel).toHaveBeenCalledOnce());
  });
});
