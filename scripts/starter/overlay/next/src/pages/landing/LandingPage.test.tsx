// @vitest-environment happy-dom
import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import i18n from '../../i18n';
import { renderWithKitRouter } from '../../lib/contexts/testing';
import LandingPage from './LandingPage';

// The app's Providers give every page a tooltip provider.
const renderLanding = () =>
  renderWithKitRouter(
    <Tooltip.Provider>
      <LandingPage />
    </Tooltip.Provider>,
  );

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

describe('LandingPage', () => {
  it('says what the app is, with one heading and a way to sign in', () => {
    renderLanding();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'Build your app on RSK' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href')).toMatch(/\/login$/);
  });

  it('speaks Arabic', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderLanding();
    expect(screen.getByRole('heading', { level: 1, name: 'ابنِ تطبيقك على RSK' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'تسجيل الدخول' })).toBeTruthy();
  });
});
