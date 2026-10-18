// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Calendar } from '@components/ui';

import i18n from '../../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

const OCTOBER_2026 = new Date(2026, 9, 1);

const dayButton = (day: number) =>
  screen.getAllByRole('button').find((button) => button.textContent === String(day) && button.dataset.outside !== 'true')!;

describe('Calendar', () => {
  it('marks the range ends and middle', () => {
    render(<Calendar mode="range" defaultMonth={OCTOBER_2026} selected={{ from: new Date(2026, 9, 12), to: new Date(2026, 9, 16) }} />);
    expect(dayButton(12).dataset.rangeStart).toBe('true');
    expect(dayButton(14).dataset.rangeMiddle).toBe('true');
    expect(dayButton(16).dataset.rangeEnd).toBe('true');
  });

  it('styles range ends with the accent fill and today with a hairline ring, not a fill', () => {
    render(<Calendar mode="single" defaultMonth={OCTOBER_2026} />);
    const className = dayButton(12).className;
    expect(className).toContain('data-[range-start=true]:bg-accent');
    expect(className).toContain('data-[today=true]:ring-border-strong');
    expect(className).not.toContain('data-[today=true]:bg-');
  });

  it('translates the navigation labels and keeps Western digits in Arabic', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(<Calendar mode="single" defaultMonth={OCTOBER_2026} />);
    expect(screen.getByRole('button', { name: 'الشهر السابق' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'الشهر التالي' })).toBeTruthy();
    const digits = screen
      .getAllByRole('gridcell')
      .map((cell) => cell.textContent)
      .join('');
    expect(digits).toMatch(/^[0-9]+$/);
  });

  it('keeps the month and year dropdown labels', () => {
    render(<Calendar mode="single" captionLayout="dropdown" defaultMonth={OCTOBER_2026} />);
    expect(screen.getByRole('combobox', { name: /month/i })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: /year/i })).toBeTruthy();
  });

  it('shows clickable outside days in fg-muted and keeps fg-subtle for disabled days', () => {
    render(<Calendar mode="single" defaultMonth={OCTOBER_2026} showOutsideDays />);
    const outside = screen.getAllByRole('button').find((button) => button.dataset.outside === 'true')!;
    expect(outside.className).toContain('data-[outside=true]:text-fg-muted');
    expect(outside.className).toContain('data-[disabled=true]:text-fg-subtle');
    expect(outside.closest('td')?.className).toContain('text-fg-muted');
  });

  it('names each day with its visible number as a word, so voice users can say what they see', () => {
    render(<Calendar mode="single" defaultMonth={new Date(2026, 9, 1)} />);
    const day = screen.getAllByRole('button').find((button) => button.textContent === '27')!;
    expect(day.getAttribute('aria-label') ?? day.textContent).toMatch(/(^|\s)27(\s|,|$)/);
  });
});
