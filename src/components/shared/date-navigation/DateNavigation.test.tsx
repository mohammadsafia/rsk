// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { DateNavigation } from '@components/shared';
import { Tooltip } from '@components/ui';

import i18n from '../../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

describe('DateNavigation', () => {
  it('translates Today, mirrors the arrows and uses gap spacing', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(
      <Tooltip.Provider>
        <DateNavigation date="2026-10-16" handlePrevious={vi.fn()} handleNext={vi.fn()} onSetDate={vi.fn()} />
      </Tooltip.Provider>,
    );
    expect(screen.getByRole('button', { name: 'اليوم' })).toBeTruthy();
    const root = document.querySelector('[data-slot="date-navigation"]') as HTMLElement;
    expect(root.className).toContain('gap-2');
    expect(root.className).not.toContain('space-x-');
    root
      .querySelectorAll('[data-slot="icon-button"] svg')
      .forEach((svg) => expect(svg.getAttribute('class')).toContain('rtl:-scale-x-100'));
  });
});
