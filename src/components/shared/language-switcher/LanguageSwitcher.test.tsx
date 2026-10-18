// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { LanguageSwitcher } from './index';

import '../../../i18n';

afterEach(cleanup);

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
});
