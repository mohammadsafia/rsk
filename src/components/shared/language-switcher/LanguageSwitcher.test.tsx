// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';
import { renderWithKitRouter } from '../../../lib/contexts/testing';

import { LanguageSwitcher } from './index';

import i18n from '../../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

describe('LanguageSwitcher', () => {
  it('its accessible name includes the visible language code (WCAG 2.5.3, label in name)', () => {
    render(
      <Tooltip.Provider>
        <LanguageSwitcher />
      </Tooltip.Provider>,
    );
    const button = screen.getByRole('button');
    const visible = button.textContent?.trim() ?? '';
    expect(visible).not.toBe('');
    expect(button.getAttribute('aria-label')).toContain(visible);
  });

  it('switches to Arabic through the router adapter, flipping the direction', async () => {
    renderWithKitRouter(
      <Tooltip.Provider>
        <LanguageSwitcher />
      </Tooltip.Provider>,
    );
    await act(async () => fireEvent.click(screen.getByRole('button', { name: /AR/ })));
    expect(i18n.language).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });
});
