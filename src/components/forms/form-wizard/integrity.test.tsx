// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { parseAsString, useQueryState } from 'nuqs';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import { StrictMode } from 'react';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { z } from 'zod';

import { Tooltip } from '@components/ui';
import { FormInput, FormWizard, FormWizardError } from '@components/forms';
import { MemoryKitRouter } from '../../../lib/contexts/testing';

import '../../../i18n';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

const wrap = (ui: React.ReactNode) => (
  <MemoryKitRouter>
    <Tooltip.Provider>{ui}</Tooltip.Provider>
  </MemoryKitRouter>
);

const next = () => fireEvent.click(screen.getByRole('button', { name: 'Next' }));
const back = () => fireEvent.click(screen.getByRole('button', { name: 'Back' }));
const submit = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
  });
};
const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

type Values = { name: string; phone: string; notes: string };

function ThreeSteps({ onSubmit, lastSchema = false }: { onSubmit: (values: Values) => void | Promise<void>; lastSchema?: boolean }) {
  const form = useForm<Values>({ defaultValues: { name: '', phone: '', notes: '' } });
  return wrap(
    <FormWizard form={form} onSubmit={onSubmit}>
      <FormWizard.Step id="patient" title="Patient" fields={['name']}>
        <FormInput name="name" label="Full name" rules={{ minLength: { value: 2, message: 'Too short' } }} />
      </FormWizard.Step>
      <FormWizard.Step id="contact" title="Contact" fields={['phone']}>
        <FormInput name="phone" label="Phone" />
      </FormWizard.Step>
      <FormWizard.Step id="notes" title="Notes" schema={lastSchema ? z.object({ notes: z.string().min(1, 'Add a note') }) : undefined}>
        <FormInput name="notes" label="Notes" />
      </FormWizard.Step>
    </FormWizard>,
  );
}

describe('FormWizard submit integrity', () => {
  it('re-validates a passed step that was edited into an invalid value before a forward jump', async () => {
    const onSubmit = vi.fn();
    render(<ThreeSteps onSubmit={onSubmit} />);
    type('Full name', 'Sara');
    next();
    await screen.findByRole('heading', { name: 'Contact' });
    back();
    await screen.findByRole('heading', { name: 'Patient' });
    type('Full name', 'x');
    fireEvent.click(screen.getByRole('button', { name: /Contact/ }));

    expect(await screen.findByText('Too short')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Patient' })).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('marks a passed step as errored and locks later steps when it is left invalid by Back', async () => {
    function Harness() {
      const form = useForm<Values>({ defaultValues: { name: '', phone: '', notes: '' } });
      return wrap(
        <FormWizard form={form} onSubmit={vi.fn()}>
          <FormWizard.Step id="patient" title="Patient">
            <FormInput name="name" label="Full name" />
          </FormWizard.Step>
          <FormWizard.Step id="contact" title="Contact" fields={['phone']}>
            <FormInput name="phone" label="Phone" rules={{ minLength: { value: 3, message: 'Too short' } }} />
          </FormWizard.Step>
          <FormWizard.Step id="notes" title="Notes">
            <FormInput name="notes" label="Notes" />
          </FormWizard.Step>
        </FormWizard>,
      );
    }
    render(<Harness />);
    next();
    await screen.findByRole('heading', { name: 'Contact' });
    type('Phone', '0790');
    next();
    await screen.findByRole('heading', { name: 'Notes' });
    fireEvent.click(screen.getByRole('button', { name: /Contact/ }));
    await screen.findByRole('heading', { name: 'Contact' });
    type('Phone', 'x');
    back();
    await screen.findByRole('heading', { name: 'Patient' });
    await waitFor(() => expect((screen.getByRole('button', { name: /Notes/ }) as HTMLButtonElement).disabled).toBe(true));
    expect(screen.getByRole('button', { name: /Contact/ }).querySelector('svg.text-danger')).not.toBeNull();
  });

  it("runs the last step's own schema before submitting", async () => {
    const onSubmit = vi.fn();
    render(<ThreeSteps onSubmit={onSubmit} lastSchema />);
    type('Full name', 'Sara');
    next();
    await screen.findByRole('heading', { name: 'Contact' });
    next();
    await screen.findByRole('heading', { name: 'Notes' });
    await submit();
    expect(await screen.findByText('Add a note')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('lets the user retry after a server error on a key no step owns', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new FormWizardError({ general: 'Card declined' }))
      .mockResolvedValueOnce(undefined);
    render(<ThreeSteps onSubmit={onSubmit} />);
    type('Full name', 'Sara');
    next();
    await screen.findByRole('heading', { name: 'Contact' });
    next();
    await screen.findByRole('heading', { name: 'Notes' });
    await submit();
    expect((await screen.findByRole('alert')).textContent).toContain('Card declined');
    await submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
  });
});

describe('FormWizard step errors', () => {
  it('clears a step schema error once the value is fixed', async () => {
    function Harness() {
      const form = useForm({ defaultValues: { name: '', phone: '' } });
      return wrap(
        <FormWizard form={form} onSubmit={vi.fn()}>
          <FormWizard.Step id="patient" title="Patient" schema={z.object({ name: z.string().min(3, 'Too short') })}>
            <FormInput name="name" label="Full name" />
          </FormWizard.Step>
          <FormWizard.Step id="contact" title="Contact">
            <FormInput name="phone" label="Phone" />
          </FormWizard.Step>
        </FormWizard>,
      );
    }
    render(<Harness />);
    type('Full name', 'ab');
    next();
    expect(await screen.findByText('Too short')).toBeTruthy();
    type('Full name', 'Sara');
    next();
    await screen.findByRole('heading', { name: 'Contact' });
    back();
    await screen.findByRole('heading', { name: 'Patient' });
    expect(screen.queryByText('Too short')).toBeNull();
  });

  it('shows an object-level refine message and still owns the fields of a refined schema', async () => {
    const schema = z
      .object({ phone: z.string(), email: z.string() })
      .refine((value) => value.phone !== '' || value.email !== '', { message: 'Give a phone or an email' });
    const onSubmit = vi.fn(async () => {
      throw new FormWizardError({ phone: 'Number already registered' });
    });
    function Harness() {
      const form = useForm({ defaultValues: { phone: '', email: '', notes: '' } });
      return wrap(
        <FormWizard form={form} onSubmit={onSubmit}>
          <FormWizard.Step id="contact" title="Contact" schema={schema}>
            <FormInput name="phone" label="Phone" />
            <FormInput name="email" label="Email" />
          </FormWizard.Step>
          <FormWizard.Step id="notes" title="Notes">
            <FormInput name="notes" label="Notes" />
          </FormWizard.Step>
        </FormWizard>,
      );
    }
    render(<Harness />);
    next();
    expect((await screen.findByRole('alert')).textContent).toContain('Give a phone or an email');

    type('Phone', '0790000000');
    next();
    await screen.findByRole('heading', { name: 'Notes' });
    await submit();
    expect(await screen.findByRole('heading', { name: 'Contact' })).toBeTruthy();
    expect(await screen.findByText('Number already registered')).toBeTruthy();
  });

  it('routes a nested server error to the step whose schema owns the parent object', async () => {
    type Address = { address: { city: string }; notes: string };
    const onSubmit = vi.fn(async () => {
      throw new FormWizardError({ 'address.city': 'Unknown city' });
    });
    function Harness() {
      const form = useForm<Address>({ defaultValues: { address: { city: 'Amman' }, notes: '' } });
      return wrap(
        <FormWizard form={form} onSubmit={onSubmit}>
          <FormWizard.Step id="address" title="Address" schema={z.object({ address: z.object({ city: z.string().min(1) }) })}>
            <FormInput name="address.city" label="City" />
          </FormWizard.Step>
          <FormWizard.Step id="notes" title="Notes">
            <FormInput name="notes" label="Notes" />
          </FormWizard.Step>
        </FormWizard>,
      );
    }
    render(<Harness />);
    next();
    await screen.findByRole('heading', { name: 'Notes' });
    await submit();
    expect(await screen.findByRole('heading', { name: 'Address' })).toBeTruthy();
    expect(await screen.findByText('Unknown city')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('flattens nested resolver errors into readable messages', async () => {
    type Address = { address: { city: string } };
    function Harness() {
      const form = useForm<Address>({
        defaultValues: { address: { city: '' } },
        resolver: zodResolver(z.object({ address: z.object({ city: z.string().min(1, 'Enter the city') }) })),
      });
      return wrap(
        <FormWizard form={form} onSubmit={vi.fn()}>
          <FormWizard.Step id="intro" title="Intro">
            <p>Welcome</p>
          </FormWizard.Step>
          <FormWizard.Step id="done" title="Done">
            <p>Done</p>
          </FormWizard.Step>
        </FormWizard>,
      );
    }
    render(<Harness />);
    next();
    await screen.findByRole('heading', { name: 'Done' });
    await submit();
    expect((await screen.findByRole('alert')).textContent).toContain('Enter the city');
  });
});

describe('FormWizard announcements', () => {
  it('stays silent until the wizard moves, even in StrictMode', async () => {
    render(<StrictMode>{<ThreeSteps onSubmit={vi.fn()} />}</StrictMode>);
    const live = () => document.querySelector('[aria-live="polite"]')?.textContent;
    expect(document.activeElement).toBe(document.body);
    type('Full name', 'Sara');
    expect(live()).toBe('');
    next();
    await screen.findByRole('heading', { name: 'Contact' });
    await waitFor(() => expect(live()).toBe('Step 2 of 3, Contact'));
  });
});

describe('FormWizard URL sync history', () => {
  function UrlWizard() {
    const form = useForm<Values>({ defaultValues: { name: '', phone: '', notes: '' } });
    return (
      <FormWizard form={form} onSubmit={vi.fn()} urlSync>
        <FormWizard.Step id="patient" title="Patient" fields={['name']}>
          <FormInput name="name" label="Full name" />
        </FormWizard.Step>
        <FormWizard.Step id="contact" title="Contact">
          <FormInput name="phone" label="Phone" />
        </FormWizard.Step>
      </FormWizard>
    );
  }

  function BrowserBack() {
    const [, setStep] = useQueryState('step', parseAsString);
    return (
      <button type="button" onClick={() => void setStep('patient')}>
        Browser back
      </button>
    );
  }

  it('pushes a history entry per step and follows the URL when it changes', async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    render(
      <NuqsTestingAdapter searchParams="" onUrlUpdate={onUrlUpdate}>
        {wrap(
          <>
            <UrlWizard />
            <BrowserBack />
          </>,
        )}
      </NuqsTestingAdapter>,
    );
    type('Full name', 'Sara');
    next();
    await screen.findByRole('heading', { name: 'Contact' });
    await waitFor(() => expect(onUrlUpdate.mock.calls.at(-1)?.[0].options.history).toBe('push'));

    fireEvent.click(screen.getByRole('button', { name: 'Browser back' }));
    expect(await screen.findByRole('heading', { name: 'Patient' })).toBeTruthy();
  });
});

describe('FormWizard draft lifecycle', () => {
  const KEY = 'rsk:wizard:intake';

  function DraftWizard({ onSubmit }: { onSubmit: (values: Values) => void }) {
    const form = useForm<Values>({ defaultValues: { name: '', phone: '', notes: '' } });
    return wrap(
      <FormWizard
        form={form}
        draftKey="intake"
        onSubmit={async (values) => {
          onSubmit(values);
          form.reset();
        }}
      >
        <FormWizard.Step id="patient" title="Patient" fields={['name']}>
          <FormInput name="name" label="Full name" />
        </FormWizard.Step>
        <FormWizard.Step id="contact" title="Contact">
          <FormInput name="phone" label="Phone" />
        </FormWizard.Step>
        <FormWizard.Step id="notes" title="Notes">
          <FormInput name="notes" label="Notes" />
        </FormWizard.Step>
      </FormWizard>,
    );
  }

  it('does not write the draft back after a submit that resets the form', async () => {
    const onSubmit = vi.fn();
    render(<DraftWizard onSubmit={onSubmit} />);
    type('Full name', 'Sara');
    next();
    await screen.findByRole('heading', { name: 'Contact' });
    next();
    await screen.findByRole('heading', { name: 'Notes' });
    await submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('restores the step by id with its completed steps', async () => {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ values: { name: 'Sara', phone: '079' }, stepId: 'notes', completed: ['patient', 'contact'] }),
    );
    render(<DraftWizard onSubmit={vi.fn()} />);
    expect(await screen.findByRole('heading', { name: 'Notes' })).toBeTruthy();
    expect((screen.getByRole('button', { name: /Contact/ }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByRole('button', { name: /Patient/ }).querySelector('svg')).not.toBeNull();
  });
});
