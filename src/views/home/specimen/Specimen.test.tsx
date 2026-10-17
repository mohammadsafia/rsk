// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import Specimen from './Specimen';

import '../../../i18n';

afterEach(cleanup);

describe('Specimen bento', () => {
  it('describes itself once and hides the live specimens from assistive tech and focus', () => {
    render(
      <Tooltip.Provider>
        <Specimen />
      </Tooltip.Provider>,
    );
    const section = screen.getByRole('region', { name: 'Component specimens' });
    expect(section.querySelector('.sr-only')?.textContent).toMatch(/calendar|table/i);
    const grid = section.querySelector('[data-slot="specimen-grid"]') as HTMLElement;
    expect(grid.hasAttribute('inert')).toBe(true);
    expect(grid.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the real primitives', () => {
    render(
      <Tooltip.Provider>
        <Specimen />
      </Tooltip.Provider>,
    );
    for (const slot of ['calendar-event', 'tag', 'table', 'specimen-toast', 'input']) {
      expect(document.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
    expect(document.querySelector('[data-slot="table"] [data-state="selected"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="table"] td[data-numeric="true"]')?.textContent).toMatch(/\d/);
    expect(document.querySelector('[aria-invalid="true"]')).not.toBeNull();
  });

  it('does not letter-space Arabic eyebrows', () => {
    render(
      <Tooltip.Provider>
        <Specimen />
      </Tooltip.Provider>,
    );
    const eyebrows = [...document.querySelectorAll('span')].filter((node) => node.className.includes('tracking-wider'));
    expect(eyebrows.length).toBeGreaterThan(0);
    eyebrows.forEach((node) => expect(node.className).toContain('rtl:tracking-normal'));
  });

  it('announces nothing from outside the inert grid (no live regions leak through portals)', async () => {
    render(
      <Tooltip.Provider>
        <Specimen />
      </Tooltip.Provider>,
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    const live = [...document.querySelectorAll('[aria-live], [role="status"], [role="alert"]')].filter((node) => !node.closest('[inert]'));
    expect(live.map((node) => node.outerHTML.slice(0, 80))).toEqual([]);
  });
});
