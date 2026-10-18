// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { Combobox } from '@components/shared';

import FilterPill from './FilterPill';

import '../../../../i18n';

let reduced = false;
beforeEach(() => {
  reduced = false;
  vi.useFakeTimers();
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes('reduce'),
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  Element.prototype.animate = vi.fn(() => ({
    cancel() {},
    finished: new Promise(() => {}),
  })) as unknown as typeof Element.prototype.animate;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const renderPill = (onClear: () => void) =>
  render(
    <Combobox>
      <FilterPill label="Role" values={['Doctor']} onClear={onClear} />
    </Combobox>,
  );

describe('FilterPill', () => {
  it('fades its values out before clearing, and clears exactly once when double-clicked', () => {
    const onClear = vi.fn();
    renderPill(onClear);
    const button = screen.getByRole('button', { name: 'Remove Role filter' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onClear).not.toHaveBeenCalled();
    expect(document.querySelector('[data-slot="filter-pill"]')?.hasAttribute('data-leaving')).toBe(true);
    vi.advanceTimersByTime(400);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('clears at once under reduced motion', () => {
    reduced = true;
    const onClear = vi.fn();
    renderPill(onClear);
    fireEvent.click(document.querySelector<HTMLElement>('[data-slot="filter-pill-remove"]')!);
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
