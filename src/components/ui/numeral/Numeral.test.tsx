// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Numeral } from '@components/ui';
import { formatNumber } from '@utils';

import i18n from '../../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

describe('formatNumber', () => {
  it('groups thousands and keeps Western digits in Arabic', () => {
    expect(formatNumber(1240.5, 'en')).toBe('1,240.5');
    const arabic = formatNumber(1240.5, 'ar');
    expect(arabic).toMatch(/1,240\.5/);
    expect(arabic).not.toMatch(/[٠-٩]/);
  });

  it('formats currency with the USD default (DataTable currency range filters)', () => {
    expect(formatNumber(1240.5, 'en', { style: 'currency' })).toBe('$1,240.50');
    expect(formatNumber(0.25, 'en', { style: 'percent' })).toBe('25%');
  });
});

describe('Numeral', () => {
  it('renders the value with its unit as a superscript, LTR-isolated and tabular', () => {
    render(<Numeral value={62} unit="%" />);
    const root = document.querySelector<HTMLElement>('[data-slot="numeral"]')!;
    expect(root.getAttribute('dir')).toBe('ltr');
    expect(root.className).toContain('tabular-nums');
    expect(root.textContent).toBe('62%');
    expect(root.querySelector('sup[data-slot="numeral-unit"]')?.textContent).toBe('%');
  });

  it('uses the figure mark at figure size', () => {
    render(<Numeral value={840} size="figure" />);
    expect(screen.getByText('840').className).toContain('figure');
  });

  it('shows a dash, and no unit, when there is no value', () => {
    render(<Numeral value={null} unit="%" />);
    const root = document.querySelector<HTMLElement>('[data-slot="numeral"]')!;
    expect(root.textContent).toBe('—');
    expect(root.querySelector('sup')).toBeNull();
  });
});
