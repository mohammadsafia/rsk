// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { CalendarTimeGrid } from '@components/ui';

afterEach(cleanup);

describe('CalendarTimeGrid', () => {
  it('positions events with inset-inline-start so they mirror in RTL', () => {
    render(
      <CalendarTimeGrid.EventCard top={10} height={20} left={25} width={50}>
        Visit
      </CalendarTimeGrid.EventCard>,
    );
    const card = screen.getByRole('button', { name: 'Visit' });
    expect(card.style.insetInlineStart).toBe('25%');
    expect(card.style.left).toBe('');
  });

  it("marks today's header with accent text, not a filled circle", () => {
    render(<CalendarTimeGrid.Header dayName="Mon" dayNumber={28} isToday />);
    const number = screen.getByText('28');
    expect(number.className).toContain('text-accent');
    expect(number.className).not.toMatch(/\bbg-/);
  });

  it('draws the now line in accent', () => {
    render(<CalendarTimeGrid.NowLine percent={40} mode="always" data-testid="now" />);
    expect(screen.getByTestId('now').className).toContain('bg-accent');
  });

  it('isolates axis labels as LTR so times keep their order in Arabic', () => {
    render(<CalendarTimeGrid.Axis rows={[{ label: '9:00 AM', isHourMark: true }]} />);
    expect(screen.getByText('9:00 AM').closest('bdi')?.getAttribute('dir')).toBe('ltr');
  });
});
