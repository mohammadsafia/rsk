// @vitest-environment happy-dom
import { useState } from 'react';

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { ChipInput, type ChipInputProps } from '@components/ui';

import '../../../i18n';

afterEach(cleanup);

function Harness(props: Partial<ChipInputProps>) {
  const [value, setValue] = useState<string[]>(props.value ?? []);

  return <ChipInput aria-label="Tags" listLabel="Tags" {...props} value={value} onChange={setValue} />;
}

const setup = (props: Partial<ChipInputProps> = {}) => {
  render(<Harness {...props} />);
  return screen.getByRole('textbox', { name: 'Tags' });
};
const chips = () => [...document.querySelectorAll('[data-slot="chip-input-chip"]')].map((chip) => chip.getAttribute('data-value'));
const paste = (input: HTMLElement, text: string) => fireEvent.paste(input, { clipboardData: { getData: () => text } });

describe('ChipInput', () => {
  it('turns pasted text into chips, splitting on commas, spaces and new lines, without duplicates', () => {
    const input = setup();
    paste(input, 'react, vite\nReact');
    expect(chips()).toEqual(['react', 'vite']);
  });

  it('makes a chip on a separator or Enter, and Backspace in the empty input removes the last one', () => {
    const input = setup();
    fireEvent.change(input, { target: { value: 'react,' } });
    fireEvent.change(input, { target: { value: 'vite' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(chips()).toEqual(['react', 'vite']);
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(chips()).toEqual(['react']);
  });

  it('makes a chip from what the input shows on Enter, even before its change has rendered', () => {
    const input = setup();
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'vite');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(chips()).toEqual(['vite']);
  });

  it('keeps what was typed when the focus leaves', () => {
    const input = setup();
    fireEvent.change(input, { target: { value: 'react' } });
    fireEvent.blur(input);
    expect(chips()).toEqual(['react']);
  });

  it('removes a chip with its named remove button', async () => {
    setup({ value: ['react', 'vite'] });
    fireEvent.click(screen.getByRole('button', { name: 'Remove react' }));
    // The chip leaves with Tag's exit animation.
    await waitFor(() => expect(chips()).toEqual(['vite']));
  });

  it('marks an item that fails validate, and one flagged from outside, in words as well as colour', () => {
    setup({
      value: ['ok', 'bad', 'taken'],
      validate: (item) => item !== 'bad',
      flagged: { taken: 'Already a member' },
      invalidLabel: '(not valid)',
    });
    const bad = document.querySelector('[data-value="bad"]')!;
    const taken = document.querySelector('[data-value="taken"]')!;
    expect(bad.getAttribute('data-invalid')).toBe('true');
    expect(bad.textContent).toContain('(not valid)');
    expect(taken.getAttribute('data-invalid')).toBe('true');
    expect(taken.textContent).toContain('Already a member');
    expect(document.querySelector('[data-value="ok"]')!.getAttribute('data-invalid')).toBeNull();
  });

  it('shows its placeholder only while empty, and lists its chips under the list label', () => {
    const input = setup({ placeholder: 'Add a tag', value: [] });
    expect(input.getAttribute('placeholder')).toBe('Add a tag');
    paste(input, 'react');
    expect(input.getAttribute('placeholder')).toBeNull();
    expect(screen.getByRole('list', { name: 'Tags' })).toBeTruthy();
  });

  it('exposes invalid on the input', () => {
    const input = setup({ invalid: true });
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });
});
