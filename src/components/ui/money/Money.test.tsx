// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Money } from '@components/ui';
import { formatMoney } from '@utils';

import i18n from '../../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

describe('formatMoney', () => {
  it('formats currency, compact and accounting negatives', () => {
    expect(formatMoney(1240.5, 'en', { currency: 'USD' })).toBe('$1,240.50');
    expect(formatMoney(12400, 'en', { currency: 'USD', compact: true })).toBe('$12.4K');
    expect(formatMoney(-80, 'en', { currency: 'USD', negative: 'parentheses' })).toBe('($80.00)');
  });

  it('keeps Western digits in Arabic', () => {
    const text = formatMoney(1240.5, 'ar', { currency: 'USD' });
    expect(text).toMatch(/1,240\.50/);
    expect(text).not.toMatch(/[٠-٩]/);
  });
});

describe('Money', () => {
  it('renders an LTR-isolated, tabular amount in the app currency', () => {
    render(<Money value={1240.5} />);
    const money = screen.getByText('$1,240.50');
    expect(money.getAttribute('dir')).toBe('ltr');
    expect(money.className).toContain('tabular-nums');
  });

  it('colours negative amounts danger by default, and not with tone="none"', () => {
    const { rerender } = render(<Money value={-5} currency="USD" />);
    expect(screen.getByText('-$5.00').className).toContain('text-danger');
    rerender(<Money value={-5} currency="USD" tone="none" />);
    expect(screen.getByText('-$5.00').className).not.toContain('text-danger');
  });

  it('keeps the compact decimal when rendered as a component', () => {
    render(<Money value={12400} currency="USD" compact />);
    expect(screen.getByText('$12.4K')).toBeTruthy();
  });

  it('shows an em dash instead of crashing on an unknown currency code', () => {
    render(<Money value={5} currency="NOPE" data-testid="bad" />);
    expect(screen.getByTestId('bad').textContent).toBe('—');
  });

  it('shows an em dash for missing or invalid values', () => {
    render(
      <>
        <Money value={null} data-testid="a" />
        <Money value={undefined} data-testid="b" />
        <Money value={Number.NaN} data-testid="c" />
      </>,
    );
    for (const id of ['a', 'b', 'c']) expect(screen.getByTestId(id).textContent).toBe('—');
  });
});
