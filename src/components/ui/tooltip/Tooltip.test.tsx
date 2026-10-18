// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

afterEach(cleanup);

describe('Tooltip', () => {
  it('shows its content when the trigger receives focus', async () => {
    render(
      <Tooltip.Provider delayDuration={0}>
        <Tooltip content="Archive record">
          <button type="button">Archive</button>
        </Tooltip>
      </Tooltip.Provider>,
    );
    fireEvent.focus(screen.getByRole('button', { name: 'Archive' }));
    const tip = await screen.findByRole('tooltip');
    expect(tip.textContent).toBe('Archive record');
    const bubble = tip.closest('[data-state]') ?? tip.parentElement;
    expect((bubble as HTMLElement).className).toContain('rule-top-ink');
    expect((bubble as HTMLElement).className).toContain('origin-(--radix-tooltip-content-transform-origin)');
    expect((bubble as HTMLElement).className).toContain('data-[state=closed]:duration-instant');
    expect((bubble as HTMLElement).className).toContain('transition-none');
    // tw-animate only generates integer slide steps; 0.5 would silently render no travel.
    expect((bubble as HTMLElement).className).toContain('data-[side=top]:slide-in-from-bottom-1');
    expect((bubble as HTMLElement).className).not.toMatch(/slide-in-from-[a-z]+-0\.5/);
  });

  it('renders only the trigger when disabled', () => {
    render(
      <Tooltip.Provider delayDuration={0}>
        <Tooltip content="Archive record" disabled>
          <button type="button">Archive</button>
        </Tooltip>
      </Tooltip.Provider>,
    );
    const trigger = screen.getByRole('button', { name: 'Archive' });
    fireEvent.focus(trigger);
    expect(trigger.getAttribute('data-state')).toBeNull();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
