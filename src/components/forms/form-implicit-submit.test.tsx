// @vitest-environment happy-dom
import { useForm } from 'react-hook-form';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { FormContainer, FormDatePicker, FormInput, FormTimePicker } from '@components/forms';
import { Tooltip } from '@components/ui';
import { MemoryKitRouter } from '../../lib/contexts/testing';

import '../../i18n';

afterEach(cleanup);

/**
 * Enter in a text field, as the browser does it (HTML "implicit submission"): if the keydown isn't cancelled, the
 * form's default button, its first submit button in tree order, is clicked. happy-dom doesn't do this itself.
 */
const pressEnter = (field: HTMLInputElement) => {
  const proceed = fireEvent.keyDown(field, { key: 'Enter', code: 'Enter' });
  if (!proceed || !field.form) return;
  const defaultButton = [...field.form.elements].find(
    (element): element is HTMLButtonElement | HTMLInputElement =>
      (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) && element.type === 'submit',
  );
  if (defaultButton) fireEvent.click(defaultButton);
};

type Values = { reference: string; visit: string | null; arrival: string | null };

const Example = ({ onSuccess }: { onSuccess: (values: Values) => void }) => {
  const form = useForm<Values>({ defaultValues: { reference: 'DPP-1', visit: '2026-03-14', arrival: '10:30 AM' } });

  return (
    <FormContainer formContext={form} onSuccess={onSuccess}>
      <FormDatePicker name="visit" label="Visit date" />
      <FormTimePicker name="arrival" label="Expected arrival time" />
      <FormInput name="reference" label="Reference" />
      <FormContainer.Actions onCancel={() => undefined} />
    </FormContainer>
  );
};

describe('Enter in a form field', () => {
  it("submits the form with the form's own submit button and keeps the date and time", async () => {
    const onSuccess = vi.fn();
    render(
      <MemoryKitRouter>
        <Tooltip.Provider>
          <Example onSuccess={onSuccess} />
        </Tooltip.Provider>
      </MemoryKitRouter>,
    );

    pressEnter(screen.getByRole('textbox', { name: 'Reference' }) as HTMLInputElement);

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onSuccess.mock.calls[0][0]).toEqual({ reference: 'DPP-1', visit: '2026-03-14', arrival: '10:30 AM' });
  });

  it("only the form's submit control is a submit button: field and shell controls are plain buttons", () => {
    render(
      <MemoryKitRouter>
        <Tooltip.Provider>
          <Example onSuccess={() => undefined} />
        </Tooltip.Provider>
      </MemoryKitRouter>,
    );
    const form = document.querySelector('form') as HTMLFormElement;
    const submits = [...form.querySelectorAll('button')].filter((button) => button.type === 'submit');
    expect(submits.map((button) => button.getAttribute('aria-label') ?? button.textContent)).toEqual(['Save']);
  });
});
