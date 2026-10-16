// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import OnThisPage from './OnThisPage';

import '../../../i18n';

const HEADINGS = [
  { depth: 2, text: 'Variants', slug: 'variants' },
  { depth: 2, text: 'Sizes', slug: 'sizes' },
  { depth: 2, text: 'API', slug: 'api' },
];

const placeHeading = (slug: string, top: number) => {
  const heading = document.createElement('h2');
  heading.id = slug;
  heading.getBoundingClientRect = () => ({
    top,
    bottom: top + 24,
    left: 0,
    right: 0,
    width: 0,
    height: 24,
    x: 0,
    y: top,
    toJSON: () => ({}),
  });
  document.body.append(heading);
  return heading;
};

afterEach(() => {
  cleanup();
  document.querySelectorAll('h2').forEach((node) => node.remove());
});

describe('OnThisPage', () => {
  it('follows scroll even when the article headings mount after the outline (lazy MDX)', () => {
    render(<OnThisPage headings={HEADINGS} />);

    // The MDX body arrives later, already scrolled so that "Sizes" is the section being read.
    placeHeading('variants', -600);
    placeHeading('sizes', 40);
    placeHeading('api', 900);
    act(() => {
      fireEvent.scroll(document.body);
    });

    expect(screen.getByRole('link', { name: 'Sizes' }).getAttribute('aria-current')).toBe('location');
    expect(screen.getByRole('link', { name: 'Variants' }).getAttribute('aria-current')).toBeNull();
  });
});
