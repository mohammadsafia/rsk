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

  it('has the same field shape and height as Input, keeps digits LTR without flipping the control, and exposes invalid', () => {
    renderNumber({ invalid: true });
    const input = screen.getByRole('textbox', { name: 'Quantity' });
    expect(input.className).toContain('h-control-md');
    expect(input.className).toContain('tabular-nums');
    // Digits stay LTR through plaintext bidi; the control itself follows the page direction so siblings (error icon, steppers) line up.
    expect(input.className).toContain('[unicode-bidi:plaintext]');
    expect(input.getAttribute('dir')).toBeNull();
    expect(input.closest('[data-slot="formatted-number"]')?.getAttribute('dir')).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('lets you type through values below min and clamps to min on blur', () => {
    const handleChange = vi.fn();
    const { rerender } = renderNumber({ min: 10, max: 99, onChange: handleChange });
    const input = screen.getByRole('textbox', { name: 'Quantity' });
    fireEvent.change(input, { target: { value: '1' } });
    expect(handleChange).toHaveBeenLastCalledWith(1);
    rerender(
      <Tooltip.Provider>
        <FormattedNumber aria-label="Quantity" min={10} max={99} value={1} onChange={handleChange} />
      </Tooltip.Provider>,
    );
    fireEvent.blur(screen.getByRole('textbox', { name: 'Quantity' }));
    expect(handleChange).toHaveBeenLastCalledWith(10);
  });
  it('steps with the arrow keys without moving the caret, and keeps the consumer handler', () => {
    const handleChange = vi.fn();
    const handleKeyDown = vi.fn();
    renderNumber({ value: 5, min: 0, max: 10, onChange: handleChange, onKeyDown: handleKeyDown });
    const input = screen.getByRole('textbox', { name: 'Quantity' });
    // fireEvent returns false when a handler called preventDefault.
    expect(fireEvent.keyDown(input, { key: 'ArrowUp' })).toBe(false);
    expect(handleChange).toHaveBeenCalledWith(6);
    expect(handleKeyDown).toHaveBeenCalledTimes(1);
  });
});
