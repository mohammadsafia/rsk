// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { DirectionProvider } from '@radix-ui/react-direction';

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
  it('mirrors inside a dir="rtl" element even with no DirectionProvider above it', async () => {
    const { container } = render(
      <div dir="rtl">
        <Calendar mode="single" defaultMonth={OCTOBER_2026} />
      </div>,
    );
    const root = container.querySelector('.rdp-root') as HTMLElement;
    await vi.waitFor(() => expect(root.getAttribute('dir')).toBe('rtl'));
  });

  it('follows a section switched from RTL to LTR (dir and DirectionProvider together), without keeping the old direction', async () => {
    const Section = ({ rtl }: { rtl: boolean }) => (
      <div dir={rtl ? 'rtl' : 'ltr'}>
        <DirectionProvider dir={rtl ? 'rtl' : 'ltr'}>
          <Calendar mode="single" defaultMonth={OCTOBER_2026} />
        </DirectionProvider>
      </div>
    );
    const { container, rerender } = render(
      <div dir="rtl">
        <Section rtl />
      </div>,
    );
    const root = () => container.querySelector('.rdp-root') as HTMLElement;
    await vi.waitFor(() => expect(root().getAttribute('dir')).toBe('rtl'));
    rerender(
      <div dir="rtl">
        <Section rtl={false} />
      </div>,
    );
    await vi.waitFor(() => expect(root().getAttribute('dir')).toBe('ltr'));
  });

  it('follows the surrounding direction, not only the language: an RTL section mirrors grid and arrows together', () => {
    const { container } = render(
      <DirectionProvider dir="rtl">
        <Calendar mode="single" defaultMonth={OCTOBER_2026} />
      </DirectionProvider>,
    );
    const root = container.querySelector('.rdp-root') as HTMLElement;
    expect(root.getAttribute('dir')).toBe('rtl');
    // Arrows flip from the calendar's own dir, never from an ancestor's, so icons and layout cannot disagree.
    expect(root.className).toContain(String.raw`[&[dir=rtl]_.rdp-button\_previous>svg]:rotate-180`);
    expect(root.className).not.toMatch(/(^|\s)rtl:/);
    expect(screen.getByRole('button', { name: /previous month/i })).toBeTruthy();
  });

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
