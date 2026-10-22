// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { KitLink, useKitNavigate, usePathname, useSetLanguage } from './KitRouterContext';
import { renderWithKitRouter } from './testing';

import i18n from '../../i18n';

afterEach(cleanup);

function Where() {
  const navigate = useKitNavigate();
  return (
    <>
      <p>{usePathname()}</p>
      <button type="button" onClick={() => navigate('/settings')}>
        Go
      </button>
    </>
  );
}

describe('KitRouter', () => {
  it('routes links and navigation through the provided router', () => {
    const { history } = renderWithKitRouter(
      <>
        <KitLink href="/patients">Patients</KitLink>
        <Where />
      </>,
      { initialPath: '/dashboard' },
    );
    expect(screen.getByText('/dashboard')).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: 'Patients' }));
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(history).toEqual(['/dashboard', '/patients', '/settings']);
    expect(screen.getByText('/settings')).toBeTruthy();
  });

  it('without a provider, falls back to plain links and full page navigation (apps updated before they add one)', () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { pathname: '/billing', assign, replace: vi.fn() });
    render(
      <>
        <KitLink href="/patients">Patients</KitLink>
        <Where />
      </>,
    );
    expect(screen.getByRole('link', { name: 'Patients' }).getAttribute('href')).toBe('/patients');
    expect(screen.getByText('/billing')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(assign).toHaveBeenCalledWith('/settings');
    vi.unstubAllGlobals();
  });

  it('without a provider, follows client-side navigation the app’s own router does (pushState, via the Navigation API)', () => {
    const navigation = new EventTarget();
    vi.stubGlobal('navigation', navigation);
    window.history.replaceState({}, '', '/dashboard');
    render(<Where />);
    expect(screen.getByText('/dashboard')).toBeTruthy();
    act(() => {
      window.history.pushState({}, '', '/patients');
      navigation.dispatchEvent(new Event('currententrychange'));
    });
    expect(screen.getByText('/patients')).toBeTruthy();
    vi.unstubAllGlobals();
    window.history.replaceState({}, '', '/');
  });

  it('without a provider, changing language changes i18n (Vite behaviour)', async () => {
    function Switch() {
      const setLanguage = useSetLanguage();
      return (
        <button type="button" onClick={() => setLanguage('ar')}>
          AR
        </button>
      );
    }
    render(<Switch />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'AR' })));
    expect(i18n.language).toBe('ar');
    await act(() => i18n.changeLanguage('en'));
  });
});
