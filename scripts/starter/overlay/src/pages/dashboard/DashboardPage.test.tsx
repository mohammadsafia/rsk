// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import i18n from '../../i18n';
import DashboardPage from './DashboardPage';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

describe('DashboardPage', () => {
  it('greets with a page header and a starting point', () => {
    render(<DashboardPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeTruthy();
    expect(screen.getByText('Start building')).toBeTruthy();
  });

  it('speaks Arabic', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(<DashboardPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'لوحة التحكم' })).toBeTruthy();
  });
});
