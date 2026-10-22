// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Breadcrumb } from '@components/shared';
import { MemoryKitRouter } from '../../../lib/contexts/testing';

import i18n from '../../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

const renderCrumbs = () =>
  render(
    <MemoryKitRouter>
      <Breadcrumb withRoot links={[{ title: 'Members', href: 'members' }, { title: 'Sara Haddad' }]} />
    </MemoryKitRouter>,
  );

describe('Breadcrumb', () => {
  it('translates the root crumb and marks the current page', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderCrumbs();
    expect(screen.getByRole('link', { name: 'لوحة التحكم' })).toBeTruthy();
    expect(screen.getByText('Sara Haddad').getAttribute('aria-current')).toBe('page');
  });

  it('mirrors the separator in RTL and uses tokens', () => {
    renderCrumbs();
    const separator = document.querySelector('[data-slot="breadcrumb-separator"]') as HTMLElement;
    expect(separator.getAttribute('aria-hidden')).toBe('true');
    expect(separator.querySelector('svg')?.getAttribute('class')).toContain('rtl:-scale-x-100');
    expect(document.querySelector('nav ol')?.innerHTML).not.toMatch(/muted-400|text-primary/);
  });
});
