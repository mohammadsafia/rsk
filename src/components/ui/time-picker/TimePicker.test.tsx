// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Popover, TimePicker, Tooltip } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

const renderPicker = (props: Partial<Parameters<typeof TimePicker>[0]> = {}) =>
  render(
    <Tooltip.Provider>
      <TimePicker name="time" {...props} />
    </Tooltip.Provider>,
  );

describe('TimePicker', () => {
  it('emits "10:30" after picking 10 and 30 in 24h mode', async () => {
    const handleChange = vi.fn();
    renderPicker({ use24hFormat: true, onChange: handleChange });
    fireEvent.click(screen.getByRole('combobox', { name: /Select time/ }));
    fireEvent.click(within(await screen.findByRole('listbox', { name: 'Hours' })).getByRole('option', { name: '10' }));
    fireEvent.click(within(screen.getByRole('listbox', { name: 'Minutes' })).getByRole('option', { name: '30' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(handleChange).toHaveBeenCalledWith('10:30');
  });

  it('marks the chosen option selected', async () => {
    renderPicker({ use24hFormat: true, value: '14:45', step: 15 });
    fireEvent.click(screen.getByRole('combobox', { name: /14:45/ }));
    const hours = await screen.findByRole('listbox', { name: 'Hours' });
    expect(within(hours).getByRole('option', { name: '14' }).getAttribute('aria-selected')).toBe('true');
  });

  it('has the same field shape and height as Input, and exposes invalid', () => {
    renderPicker({ invalid: true });
    const trigger = screen.getByRole('combobox', { name: /Select time/ });
    expect(trigger.className).toContain('h-control-md');
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
  });

  it('renders the clear control outside the trigger with a translated name', () => {
    const handleChange = vi.fn();
    renderPicker({ value: '09:00', use24hFormat: true, onChange: handleChange });
    const clear = screen.getByRole('button', { name: 'Clear' });
    expect(screen.getByRole('combobox', { name: /09:00/ }).contains(clear)).toBe(false);
    fireEvent.click(clear);
    expect(handleChange).toHaveBeenCalledWith(undefined);
  });

  it('uses one tab stop per column and moves with the arrow keys', async () => {
    renderPicker({ use24hFormat: true, value: '10:00', step: 30 });
    fireEvent.click(screen.getByRole('combobox', { name: /10:00/ }));
    const hours = await screen.findByRole('listbox', { name: 'Hours' });
    const tabbable = within(hours)
      .getAllByRole('option')
      .filter((option) => option.getAttribute('tabindex') === '0');
    expect(tabbable.map((option) => option.textContent)).toEqual(['10']);
    fireEvent.keyDown(tabbable[0], { key: 'ArrowDown' });
    expect(within(hours).getByRole('option', { name: '11' }).getAttribute('aria-selected')).toBe('true');
  });

  it('snaps an off-range seed onto the grid so confirm emits what is shown', () => {
    const handleTempChange = vi.fn();
    render(
      <Tooltip.Provider>
        <Popover open>
          <Popover.Trigger>Open</Popover.Trigger>
          <TimePicker.Content tempValue="08:00 AM" onTempValueChange={handleTempChange} onConfirm={() => undefined} min="09:00" step={15} />
        </Popover>
      </Tooltip.Provider>,
    );
    expect(handleTempChange).toHaveBeenCalledWith('09:00 AM');
  });
});
