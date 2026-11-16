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
  it('keeps hours, minutes and AM/PM in reading order in Arabic too: a time is written left to right', async () => {
    // In an rtl page the columns used to mirror (AM/PM, minutes, hours), against the "10:30 AM" shown in the field.
    render(
      <div dir="rtl">
        <Tooltip.Provider>
          <TimePicker name="time" value="10:30 AM" />
        </Tooltip.Provider>
      </div>,
    );
    fireEvent.click(screen.getByRole('combobox'));
    const hours = await screen.findByRole('listbox', { name: 'Hours' });
    const columns = hours.parentElement!;
    expect(columns.getAttribute('dir')).toBe('ltr');
    expect([...columns.querySelectorAll('[role=listbox]')].map((list) => list.getAttribute('aria-label'))).toEqual([
      'Hours',
      'Minutes',
      'AM or PM',
    ]);
  });

  it('gives each option the kit’s control height, and a 44px target on touch screens', async () => {
    renderPicker({ use24hFormat: true, value: '10:00' });
    fireEvent.click(screen.getByRole('combobox'));
    const option = within(await screen.findByRole('listbox', { name: 'Hours' })).getByRole('option', { name: '10' });
    expect(option.className).toContain('h-control-md');
    expect(option.className).toContain('pointer-coarse:h-11');
  });

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

  it('is named by a <label htmlFor> pointing at its id, as the docs show', async () => {
    render(
      <Tooltip.Provider>
        <label htmlFor="visit-time">Visit time</label>
        <TimePicker id="visit-time" name="visit-time" value="10:30" use24hFormat />
      </Tooltip.Provider>,
    );
    expect(await screen.findByRole('combobox', { name: 'Visit time' })).toBeTruthy();
  });

  it('is named by aria-labelledby, and by its own text only when nothing else names it', () => {
    render(
      <Tooltip.Provider>
        <span id="arrival-label">Expected arrival time</span>
        <TimePicker name="arrival" aria-labelledby="arrival-label" value="10:30" use24hFormat />
        <TimePicker name="loose" value="11:15" use24hFormat />
      </Tooltip.Provider>,
    );
    expect(screen.getByRole('combobox', { name: 'Expected arrival time' }).textContent).toContain('10:30');
    expect(screen.getByRole('combobox', { name: '11:15' })).toBeTruthy();
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
