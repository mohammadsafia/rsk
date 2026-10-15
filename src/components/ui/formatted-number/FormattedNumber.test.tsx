// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { FormattedNumber, Tooltip } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

const renderNumber = (props: Partial<Parameters<typeof FormattedNumber>[0]> = {}) =>
  render(
    <Tooltip.Provider>
      <FormattedNumber aria-label="Quantity" {...props} />
    </Tooltip.Provider>,
  );

describe('FormattedNumber', () => {
  it('has no step buttons unless showStepButtons is set', () => {
    renderNumber({ value: 3 });
    expect(screen.queryByRole('button', { name: 'Increase' })).toBeNull();
  });

  it('disables step-down at min and steps up by stepper', () => {
    const handleChange = vi.fn();
    renderNumber({ value: 0, min: 0, max: 10, stepper: 5, showStepButtons: true, onChange: handleChange });
    expect((screen.getByRole('button', { name: 'Decrease' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Increase' }));
    expect(handleChange).toHaveBeenCalledWith(5);
  });

  it('disables step-up at max', () => {
    renderNumber({ value: 10, min: 0, max: 10, showStepButtons: true });
    expect((screen.getByRole('button', { name: 'Increase' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('has the same field shape and height as Input, in an LTR island, and exposes invalid', () => {
    renderNumber({ invalid: true });
    const input = screen.getByRole('textbox', { name: 'Quantity' });
    expect(input.className).toContain('h-control-md');
    expect(input.className).toContain('tabular-nums');
    expect(input.getAttribute('dir')).toBe('ltr');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });
});
