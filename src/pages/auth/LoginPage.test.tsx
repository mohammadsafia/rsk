// @vitest-environment happy-dom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { AuthProvider } from '@contexts';

import { renderWithKitRouter } from '../../lib/contexts/testing';
import LoginPage from './LoginPage';

import '../../i18n';

afterEach(cleanup);

const renderLogin = (props: Parameters<typeof LoginPage>[0]) =>
  renderWithKitRouter(
    <AuthProvider>
      <LoginPage {...props} />
    </AuthProvider>,
  );

describe('LoginPage demo hint', () => {
  it('shows the demo account the server passes', () => {
    renderLogin({ demo: { email: 'demo@example.com', password: 'demo-password' } });
    expect(screen.getByText('Demo account')).toBeTruthy();
    expect(screen.getByText('demo@example.com')).toBeTruthy();
  });

  it('shows none when the server says there is no demo account (a real API)', () => {
    renderLogin({ demo: null });
    expect(screen.queryByText('Demo account')).toBeNull();
  });

  it('left to itself (the Vite app), follows the app config as before', () => {
    renderLogin({});
    expect(screen.getByText('Demo account')).toBeTruthy();
  });
});
