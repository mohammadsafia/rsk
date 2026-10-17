// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Logo } from '@components/shared';

afterEach(cleanup);

const rects = () => [...document.querySelectorAll('[data-slot="logo"] rect')];

describe('Logo', () => {
  it('draws the building-block mark from tokens only', () => {
    render(<Logo />);
    expect(screen.getByRole('img', { name: 'RSK' })).toBeTruthy();
    const [tile, ...squares] = rects();
    expect(tile.getAttribute('class')).toContain('fill-fg');
    expect(squares).toHaveLength(4);
    expect(squares.slice(0, 3).every((square) => square.getAttribute('class')?.includes('fill-canvas'))).toBe(true);
    expect(squares[3].getAttribute('class')).toContain('fill-accent');
    expect(squares[3].getAttribute('rx')).toBe('4');
    expect(document.body.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b|oklch\(/i);
  });

  it('switches to the 16px geometry at size sm and mirrors in RTL', () => {
    render(<Logo size="sm" />);
    const [, first] = rects();
    expect(first.getAttribute('width')).toBe('8.5');
    expect(first.getAttribute('x')).toBe('6.5');
    expect(document.querySelector('[data-slot="logo"] svg')?.getAttribute('class')).toContain('rtl:-scale-x-100');
  });

  it('renders the lockup with a visible wordmark and an optional tagline', () => {
    render(<Logo variant="lockup" tagline />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('RSK')).toBeTruthy();
    expect(screen.getByText('React Starter Kit')).toBeTruthy();
  });
});
