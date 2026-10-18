// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FormDatePicker, FormDateRange } from '@components/forms';
import { Tooltip } from '@components/ui';

import '../../i18n';

afterEach(cleanup);

/** A form whose value can be changed from outside, as an app would (load, setValue, reset). */
function Harness({ children, defaultValues }: { children: React.ReactNode; defaultValues: Record<string, unknown> }) {
  const methods = useForm({ defaultValues });
  return (
    <FormProvider {...methods}>
      <Tooltip.Provider>{children}</Tooltip.Provider>
      <button type="button" onClick={() => methods.setValue('visit', '2026-01-02')}>
        set visit
      </button>
      <button type="button" onClick={() => methods.reset({ visit: null, stay: null })}>
        reset
      </button>
      <button type="button" onClick={() => methods.setValue('stay', { from: new Date(2026, 2, 3), to: new Date(2026, 2, 7) })}>
        set stay
      </button>
    </FormProvider>
  );
}

const box = (name: string) => screen.getByRole('textbox', { name }) as HTMLInputElement;

describe('date fields keep the box and the form value in step', () => {
  it('a single date: shows the loaded value, refills on setValue, empties on reset', () => {
    render(
      <Harness defaultValues={{ visit: '2026-10-18' }}>
        <FormDatePicker name="visit" label="Visit" />
      </Harness>,
    );
    expect(box('Visit').value).toBe('10/18/2026');
    fireEvent.click(screen.getByRole('button', { name: 'set visit' }));
    expect(box('Visit').value).toBe('01/02/2026');
    fireEvent.click(screen.getByRole('button', { name: 'reset' }));
    expect(box('Visit').value).toBe('');
  });

  it('a single date: what the person is typing stays in the box, even while the value is not a date yet', () => {
    render(
      <Harness defaultValues={{ visit: '2026-10-18' }}>
        <FormDatePicker name="visit" label="Visit" />
      </Harness>,
    );
    fireEvent.change(box('Visit'), { target: { value: '03/1' } });
    expect(box('Visit').value).toBe('03/1');
  });

  it('a single date: a date set from outside replaces a half-typed one (typing that changed no value leaves no claim)', () => {
    render(
      <Harness defaultValues={{ visit: null }}>
        <FormDatePicker name="visit" label="Visit" />
      </Harness>,
    );
    fireEvent.change(box('Visit'), { target: { value: '03/1' } });
    expect(box('Visit').value).toBe('03/1');
    fireEvent.click(screen.getByRole('button', { name: 'set visit' }));
    expect(box('Visit').value).toBe('01/02/2026');
  });

  it('a range: shows the loaded range and refills on setValue', () => {
    render(
      <Harness defaultValues={{ stay: { from: new Date(2026, 9, 1), to: new Date(2026, 9, 5) } }}>
        <FormDateRange name="stay" label="Stay" />
      </Harness>,
    );
    expect(box('Stay').value).toBe('10/01/2026 - 10/05/2026');
    fireEvent.click(screen.getByRole('button', { name: 'set stay' }));
    expect(box('Stay').value).toBe('03/03/2026 - 03/07/2026');
  });

  it('an invalid Date value renders an empty box instead of looping (Too many re-renders)', () => {
    render(
      <Harness defaultValues={{ visit: new Date('not a date') }}>
        <FormDatePicker name="visit" label="Visit" />
      </Harness>,
    );
    expect(box('Visit').value).toBe('');
  });
});
