// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { AuthGuard, AuthLayout } from '@layouts';
import { AuthProvider, SESSION_KEY } from '@contexts';
import { DEMO_CREDENTIALS } from '@api/mock/auth';
import { ReactRouterKitProvider } from '@routes/routerAdapter';

import i18n from '../../i18n';
import ForgotPasswordPage from './ForgotPasswordPage';
import LoginPage from './LoginPage';

function Where() {
  const location = useLocation();
  return <p data-testid="where">{`${location.pathname}${location.search}`}</p>;
}

const renderAt = (path: string) => {
  const router = createMemoryRouter(
    [
      {
        path: '/auth',
        element: <AuthLayout />,
        children: [
          { path: '/auth/login', element: <LoginPage /> },
          { path: '/auth/forgot-password', element: <ForgotPasswordPage /> },
        ],
      },
      {
        element: <AuthGuard />,
        children: [
          {
            element: <Outlet />,
            children: [
              { path: '/dashboard', element: <Where /> },
              { path: '/patients', element: <Where /> },
            ],
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(
    <AuthProvider>
      <ReactRouterKitProvider>
        <RouterProvider router={router} />
      </ReactRouterKitProvider>
    </AuthProvider>,
  );
  return router;
};

const SESSION = { token: 'demo-token', user: { userId: 'demo', name: 'Demo User', email: DEMO_CREDENTIALS.email } };
const fill = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => localStorage.clear());
afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

describe('sign-in flow', () => {
  it('sends a signed-out visitor to sign in, remembering where they were going', async () => {
    const router = renderAt('/patients?page=2');
    await waitFor(() => expect(router.state.location.pathname).toBe('/auth/login'));
    expect(new URLSearchParams(router.state.location.search).get('next')).toBe('/patients?page=2');
  });

  it('signs in with the demo account and continues to where they were going', async () => {
    renderAt('/auth/login?next=%2Fpatients%3Fpage%3D2');
    expect(await screen.findByText(DEMO_CREDENTIALS.password, { exact: false })).toBeTruthy(); // the demo hint (mock mode)
    fill(/^Email/, DEMO_CREDENTIALS.email);
    fill(/^Password/, DEMO_CREDENTIALS.password);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect((await screen.findByTestId('where', {}, { timeout: 3000 })).textContent).toBe('/patients?page=2');
    expect(JSON.parse(localStorage.getItem(SESSION_KEY)!).user.email).toBe(DEMO_CREDENTIALS.email);
  });

  it('says so when the password is wrong, and stays on the page', async () => {
    renderAt('/auth/login');
    fill(/^Email/, DEMO_CREDENTIALS.email);
    fill(/^Password/, 'wrong-password');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect((await screen.findByRole('alert', {}, { timeout: 3000 })).textContent).toMatch(/email or password is incorrect/i);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('asks for a valid email and a password before calling the API', async () => {
    renderAt('/auth/login');
    fill(/^Email/, 'not-an-email');
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter a valid email address')).toBeTruthy();
    expect(screen.getByText('Enter your password')).toBeTruthy();
  });

  it('never follows a next that leaves the app', async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(SESSION));
    const router = renderAt('/auth/login?next=%2F%2Fevil.example');
    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard'));
  });

  it('sends a signed-in visitor on from the sign-in page', async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(SESSION));
    const router = renderAt('/auth/login?next=%2Fpatients');
    await waitFor(() => expect(router.state.location.pathname).toBe('/patients'));
  });

  it('reads in Arabic', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderAt('/auth/login');
    expect(await screen.findByRole('heading', { name: 'تسجيل الدخول' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'تسجيل الدخول' })).toBeTruthy();
  });
});

describe('forgot password', () => {
  it('confirms a reset is on its way without saying whether the account exists', async () => {
    renderAt('/auth/forgot-password');
    fill(/^Email/, 'nobody@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(await screen.findByText(/If an account exists for nobody@example.com/, {}, { timeout: 3000 })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to sign in' }).getAttribute('href')).toBe('/auth/login');
  });

  it('is linked from the sign-in page', async () => {
    renderAt('/auth/login');
    expect((await screen.findByRole('link', { name: 'Forgot password?' })).getAttribute('href')).toBe('/auth/forgot-password');
  });

  describe('after the review', () => {
    it('moves focus to the reset confirmation, so a screen reader reads it', async () => {
      renderAt('/auth/forgot-password');
      fill(/^Email/, 'nobody@example.com');
      fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));
      const confirmation = await screen.findByText(/If an account exists/, {}, { timeout: 3000 });
      await waitFor(() => expect(document.activeElement).not.toBe(document.body));
      expect(document.activeElement?.contains(confirmation)).toBe(true);
    });

    it('keeps the logo and shows progress while a signed-in visitor is sent on (no blank screen)', async () => {
      localStorage.setItem(SESSION_KEY, JSON.stringify(SESSION));
      // The app's pages load with their routes; one that never arrives stands for a slow network.
      const router = createMemoryRouter(
        [
          { path: '/auth', element: <AuthLayout />, children: [{ path: '/auth/login', element: <LoginPage /> }] },
          { path: '/dashboard', lazy: () => new Promise<never>(() => {}) },
        ],
        { initialEntries: ['/auth/login'] },
      );
      render(
        <AuthProvider>
          <ReactRouterKitProvider>
            <RouterProvider router={router} />
          </ReactRouterKitProvider>
        </AuthProvider>,
      );
      await waitFor(() => expect(router.state.navigation.state).toBe('loading'));
      expect(document.querySelector('main [data-slot="logo"]')).not.toBeNull();
      expect(screen.getByRole('status')).toBeTruthy();
    });
  });
});
