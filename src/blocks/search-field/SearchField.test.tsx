// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { Dialog } from '@components/ui';

import { SearchField } from './index';

import '../../i18n';

type Person = { id: string; name: string };

const PEOPLE: Person[] = [
  { id: 'lina', name: 'Lina Khoury' },
  { id: 'omar', name: 'Omar Nasser' },
  { id: 'layla', name: 'Layla Haddad' },
];

const renderField = (onSearch: (query: string) => Promise<Person[]> | Person[], onSelect = vi.fn()) => {
  render(
    <SearchField<Person>
      label="Search people"
      onSearch={onSearch}
      getLabel={(person) => person.name}
      getKey={(person) => person.id}
      onSelect={onSelect}
    />,
  );
  return { input: screen.getByRole('combobox', { name: 'Search people' }), onSelect };
};

/** Types `text`, lets the debounce run out and the search resolve. */
const type = async (input: HTMLElement, text: string) => {
  fireEvent.change(input, { target: { value: text } });
  await act(async () => {
    vi.advanceTimersByTime(250);
  });
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('SearchField', () => {
  it('does not search below the minimum length', async () => {
    const onSearch = vi.fn(() => PEOPLE);
    const { input } = renderField(onSearch);
    await type(input, 'l');
    expect(onSearch).not.toHaveBeenCalled();
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('searches once after the debounce and lists the results as options', async () => {
    const onSearch = vi.fn((query: string) => PEOPLE.filter((person) => person.name.toLowerCase().includes(query)));
    const { input } = renderField(onSearch);
    fireEvent.change(input, { target: { value: 'l' } });
    fireEvent.change(input, { target: { value: 'la' } });
    await act(async () => {
      vi.advanceTimersByTime(250);
    });
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('la');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Layla Haddad']);
    expect(screen.getByRole('listbox').id).toBe(input.getAttribute('aria-controls'));
  });

  it('moves with the arrow keys and selects with Enter', async () => {
    const { input, onSelect } = renderField(() => PEOPLE);
    await type(input, 'na');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const active = document.getElementById(input.getAttribute('aria-activedescendant') ?? '');
    expect(active?.textContent).toBe('Omar Nasser');
    expect(active?.getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(PEOPLE[1]);
    expect((input as HTMLInputElement).value).toBe('Omar Nasser');
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes with Escape', async () => {
    const { input } = renderField(() => PEOPLE);
    await type(input, 'na');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('keeps the Escape that closes its suggestions from closing a dialog around it, and lets the next one through', async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <Dialog.Content title="Find someone">
          <SearchField<Person>
            label="Search people"
            onSearch={() => PEOPLE}
            getLabel={(person) => person.name}
            getKey={(person) => person.id}
            onSelect={vi.fn()}
          />
        </Dialog.Content>
      </Dialog>,
    );
    const input = screen.getByRole('combobox', { name: 'Search people' });
    await type(input, 'na');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('says so when nothing matches', async () => {
    const { input } = renderField(() => []);
    await type(input, 'zz');
    expect(screen.getByRole('status').textContent).toBe('No results for “zz”');
  });

  it('shows "Searching…" while a slow search runs', async () => {
    const { input } = renderField(() => new Promise<Person[]>(() => {}));
    await type(input, 'la');
    expect(screen.getByRole('status').textContent).toBe('Searching…');
  });

  it('surfaces a failed search instead of showing no results', async () => {
    const { input } = renderField(() => Promise.reject(new Error('offline')));
    await type(input, 'la');
    expect(screen.getByRole('status').textContent).toBe('The search didn’t work. Try again.');
  });
});
