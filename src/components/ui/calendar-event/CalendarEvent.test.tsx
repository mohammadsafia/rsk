// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { CalendarEvent } from '@components/ui';

afterEach(cleanup);

describe('CalendarEvent', () => {
  it('is a soft tone tint with a status dot and readable text, never a side stripe', () => {
    render(<CalendarEvent tone="danger">11:30 · Patient B</CalendarEvent>);
    const block = screen.getByText('11:30 · Patient B').closest('[data-slot="calendar-event"]') as HTMLElement;
    expect(block.dataset.tone).toBe('danger');
    expect(block.className).toContain('bg-danger-subtle');
    expect(block.className).toContain('text-fg');
    expect(block.className).not.toMatch(/border-s/);
    expect(block.querySelector('[aria-hidden="true"]')?.className).toContain('bg-danger');
  });

  it('defaults to the neutral tone and mutes past events', () => {
    render(<CalendarEvent past>09:00 · Patient A</CalendarEvent>);
    const block = screen.getByText('09:00 · Patient A').closest('[data-slot="calendar-event"]') as HTMLElement;
    expect(block.dataset.tone).toBe('neutral');
    expect(block.dataset.past).toBe('true');
  });
});
