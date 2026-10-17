// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Tooltip } from '@components/ui';

import { getComponentDocsRegistry } from '@component-docs/registry';

import DocHeader from './DocHeader';
import OnThisPage from './OnThisPage';
import PrevNext from './PrevNext';

import '../../../i18n';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const button = () => getComponentDocsRegistry().find((doc) => doc.id === 'button')!;

describe('DocHeader', () => {
  it('shows an LTR import line derived from the category', () => {
    render(
      <Tooltip.Provider>
        <MemoryRouter>
          <DocHeader entry={button()} />
        </MemoryRouter>
      </Tooltip.Provider>,
    );
    const line = document.querySelector('[data-slot="docs-import"] code') as HTMLElement;
    expect(line.textContent).toBe("import { Button } from '@components/ui';");
    expect(line.getAttribute('dir')).toBe('ltr');
    expect(screen.getByRole('heading', { level: 1, name: 'Button' })).toBeTruthy();
  });
});

describe('OnThisPage', () => {
  it('links every heading and marks the one in view', () => {
    let callback: (entries: Array<{ isIntersecting: boolean; target: Element }>) => void = () => {};
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: typeof callback) {
          callback = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    document.body.innerHTML = '<h2 id="variants">Variants</h2><h2 id="props">Props</h2>';
    render(
      <OnThisPage
        headings={[
          { depth: 2, text: 'Variants', slug: 'variants' },
          { depth: 2, text: 'Props', slug: 'props' },
        ]}
      />,
      { container: document.body.appendChild(document.createElement('div')) },
    );
    const nav = screen.getByRole('navigation', { name: 'On this page' });
    expect(nav.querySelector('a[href="#props"]')).not.toBeNull();
    act(() => callback([{ isIntersecting: true, target: document.getElementById('props')! }]));
    expect(nav.querySelector('a[href="#props"]')?.getAttribute('aria-current')).toBe('location');
  });
});

describe('PrevNext', () => {
  it('links the neighbours in reading order', () => {
    render(
      <MemoryRouter>
        <PrevNext id="button" />
      </MemoryRouter>,
    );
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links.every((link) => link.getAttribute('href')?.startsWith('/docs'))).toBe(true);
  });
});
