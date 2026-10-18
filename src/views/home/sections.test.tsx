// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { Documented, Features, GetGoing, LandingFooter, Structure, Tooling } from '@views/home';

import i18n from '../../i18n';

afterEach(async () => {
  cleanup();
  await act(() => i18n.changeLanguage('en'));
});

const renderAll = () =>
  render(
    <Tooltip.Provider>
      <MemoryRouter>
        <Features />
        <Documented />
        <Tooling />
        <Structure />
        <GetGoing />
        <LandingFooter />
      </MemoryRouter>
    </Tooltip.Provider>,
  );

describe('landing sections', () => {
  it('labels every section with its h2', () => {
    renderAll();
    for (const name of [
      'Everything wired, nothing in your way.',
      'See exactly what you get.',
      "Generate, don't write.",
      'Organized by design.',
      'Up and running in seconds.',
    ]) {
      const heading = screen.getByRole('heading', { level: 2, name });
      expect(heading.closest('section')?.getAttribute('aria-labelledby')).toBe(heading.id);
    }
  });

  it('numbers the six features in mono', () => {
    renderAll();
    const numbers = [...document.querySelectorAll('[data-slot="landing-feature"] [data-slot="landing-feature-number"]')].map(
      (node) => node.textContent,
    );
    expect(numbers).toEqual(['01', '02', '03', '04', '05', '06']);
  });

  it('keeps code, commands and aliases left-to-right in Arabic', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderAll();
    const code = document.querySelectorAll('[data-slot="landing-terminal"], [data-slot="landing-alias"], [data-slot="landing-command"]');
    expect(code.length).toBeGreaterThanOrEqual(1 + 6 + 3);
    code.forEach((node) => expect(node.getAttribute('dir')).toBe('ltr'));
  });

  it('copies a command', async () => {
    const writes: string[] = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text: string) => void writes.push(text) },
    });
    renderAll();
    await act(async () => screen.getAllByRole('button', { name: /Copy/ })[1].click());
    expect(writes).toEqual(['pnpm install']);
  });

  it('does not letter-space Arabic eyebrows (tracking breaks the joined script)', () => {
    renderAll();
    const eyebrows = [...document.querySelectorAll('section p')].filter((node) => node.className.includes('uppercase'));
    expect(eyebrows.length).toBeGreaterThan(0);
    eyebrows.forEach((node) => expect(node.className).toContain('rtl:tracking-normal'));
  });

  it('isolates translated log lines so Arabic reads right-to-left inside the LTR terminal', async () => {
    await act(() => i18n.changeLanguage('ar'));
    renderAll();
    const lines = document.querySelectorAll('[data-slot="landing-terminal"] bdi');
    expect(lines).toHaveLength(5);
    lines.forEach((line) => expect(line.getAttribute('dir')).toBe('auto'));
  });

  it('drops negative tracking on Arabic headings', () => {
    renderAll();
    screen.getAllByRole('heading', { level: 2 }).forEach((heading) => expect(heading.className).toContain('rtl:tracking-normal'));
  });
});
