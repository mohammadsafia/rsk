// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Progress } from '@components/ui';

afterEach(cleanup);

describe('Progress', () => {
  it('reports its value and scales the fill from the inline start', () => {
    render(<Progress value={40} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    const fill = bar.querySelector<HTMLElement>('[data-slot="progress-indicator"]')!;
    expect(fill.style.transform).toBe('scaleX(0.4)');
    expect(fill.className).toContain('origin-left');
    expect(fill.className).toContain('rtl:origin-right');
  });

  it('clamps out-of-range values and exposes its tone', () => {
    render(<Progress value={180} tone="danger" />);
    const bar = screen.getByRole('progressbar');
    expect(bar.dataset.tone).toBe('danger');
    expect(bar.querySelector<HTMLElement>('[data-slot="progress-indicator"]')!.style.transform).toBe('scaleX(1)');
  });

  it('is a square 3px fg rule by default', () => {
    render(<Progress value={40} aria-label="Claims processed" />);
    const bar = screen.getByRole('progressbar', { name: 'Claims processed' });
    expect(bar.dataset.tone).toBe('neutral');
    expect(bar.className).not.toContain('rounded-full');
    expect(bar.querySelector<HTMLElement>('[data-slot="progress-indicator"]')!.className).toContain('bg-fg');
  });
});
