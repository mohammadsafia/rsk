// @vitest-environment happy-dom
// tests/docs/mdx-links.test.tsx — links written in MDX stay inside the site wherever it is served (/rsk/ on Pages).
import { readFileSync } from 'node:fs';
import { createElement, type ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { mdxComponents } from '../../src/component-docs/mdx-components';

afterEach(cleanup);

const renderLink = (href: string, text: string) => {
  const A = mdxComponents.a as (props: { href: string; children?: ReactNode }) => ReactNode;
  const router = createMemoryRouter([{ path: '/docs', element: createElement(A, { href }, text) }], {
    basename: '/rsk',
    initialEntries: ['/rsk/docs'],
  });
  render(createElement(RouterProvider, { router }));
  return screen.getByRole('link', { name: text });
};

describe('links in MDX', () => {
  it('route an in-site path through the router, so it keeps the base path', () => {
    expect(renderLink('/docs/components/confirm-dialog', 'ConfirmDialog').getAttribute('href')).toBe('/rsk/docs/components/confirm-dialog');
  });

  it('leave external links and same-page anchors as they are', () => {
    expect(renderLink('https://www.w3.org/WAI/', 'WAI').getAttribute('href')).toBe('https://www.w3.org/WAI/');
    cleanup();
    expect(renderLink('#props', 'Props').getAttribute('href')).toBe('#props');
  });
});

describe('web manifest', () => {
  it('names its icons relative to itself, so they load under /rsk/ too', () => {
    const manifest = JSON.parse(readFileSync('public/site.webmanifest', 'utf8')) as { icons: { src: string }[] };
    for (const icon of manifest.icons) expect(icon.src.startsWith('/')).toBe(false);
  });
});
