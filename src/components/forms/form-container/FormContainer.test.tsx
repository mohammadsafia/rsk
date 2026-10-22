// @vitest-environment happy-dom
import { useForm } from 'react-hook-form';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { FormContainer, FormInput } from '@components/forms';
import { Tooltip } from '@components/ui';
import { MemoryKitRouter } from '../../../lib/contexts/testing';

import '../../../i18n';

afterEach(cleanup);

const Example = ({ onSuccess, onCancel }: { onSuccess: () => Promise<void> | void; onCancel: () => void }) => {
  const form = useForm({ defaultValues: { name: '' } });

  return (
    <FormContainer formContext={form} onSuccess={onSuccess}>
      <FormInput name="name" label="Name" />
      <FormContainer.Actions confirmOnCancel onCancel={onCancel} />
    </FormContainer>
  );
};

const renderExample = (props: { onSuccess?: () => Promise<void> | void; onCancel?: () => void } = {}) => {
  const onCancel = props.onCancel ?? vi.fn();
  render(
    <MemoryKitRouter>
      <Tooltip.Provider>
        <Example onSuccess={props.onSuccess ?? (() => undefined)} onCancel={onCancel} />
      </Tooltip.Provider>
    </MemoryKitRouter>,
  );
  return { onCancel };
};

describe('FormContainer.Actions', () => {
  it('shows the submit button as loading while the submit handler runs', async () => {
    renderExample({ onSuccess: () => new Promise<void>(() => undefined) });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Save/ }).getAttribute('aria-busy')).toBe('true'));
  });

  it('cancels a pristine form without asking', () => {
    const { onCancel } = renderExample();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('asks before discarding a dirty form', async () => {
    const { onCancel } = renderExample();
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Layla' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByRole('dialog', { name: 'Discard unsaved changes?' })).toBeTruthy();
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
