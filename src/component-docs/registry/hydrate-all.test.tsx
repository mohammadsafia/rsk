// @vitest-environment happy-dom
// Every docs page renders the same on a server as in the browser, in English and Arabic: what a Next app needs from the
// kit. Each page is prerendered (waiting for every Suspense boundary), then hydrated; any mismatch fails it.
import { act, type ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { prerender } from 'react-dom/static';
import { MDXProvider } from '@mdx-js/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { Tooltip } from '@components/ui';
import { NowProvider, ThemeProvider } from '@contexts';

import { getComponentDocsRegistry } from '@component-docs/registry';
import { mdxComponents } from '@component-docs/mdx-components';
import { ReactRouterKitProvider } from '@routes/routerAdapter';

import i18n from '../../i18n';

/** A fixed render time, as a server would hand to the page. */
const FIXED_NOW = new Date('2026-10-20T09:00:00Z');

/** What a server lacks: while prerendering, these globals are undefined, as they are in Node. */
const BROWSER_GLOBALS = ['window', 'document', 'localStorage', 'sessionStorage', 'matchMedia'] as const;

/** The page's HTML as a server would send it: prerendered (every Suspense boundary resolved) with no browser globals. */
const toServerHtml = async (tree: ReactElement): Promise<string> => {
  const saved = BROWSER_GLOBALS.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  for (const key of BROWSER_GLOBALS) Object.defineProperty(globalThis, key, { value: undefined, configurable: true, writable: true });
  try {
    const { prelude } = await prerender(tree);
    return await new Response(prelude).text();
  } finally {
    for (const [key, descriptor] of saved) if (descriptor) Object.defineProperty(globalThis, key, descriptor);
  }
};

afterEach(async () => {
  document.body.innerHTML = '';
  await act(() => i18n.changeLanguage('en'));
});

const page = (Doc: () => ReactElement, client: QueryClient): ReactElement => (
  <QueryClientProvider client={client}>
    <ThemeProvider>
      <NuqsTestingAdapter>
        <ReactRouterKitProvider>
          <MemoryRouter>
            <NowProvider now={FIXED_NOW}>
              <Tooltip.Provider>
                <MDXProvider components={mdxComponents}>
                  <Doc />
                </MDXProvider>
              </Tooltip.Provider>
            </NowProvider>
          </MemoryRouter>
        </ReactRouterKitProvider>
      </NuqsTestingAdapter>
    </ThemeProvider>
  </QueryClientProvider>
);

describe.each(['en', 'ar'])('every docs page hydrates without a mismatch (%s)', (language) => {
  it.each(getComponentDocsRegistry().map((entry) => [entry.id, entry] as const))('%s', async (_id, entry) => {
    await act(() => i18n.changeLanguage(language));
    const { default: Doc } = (await entry.load()) as { default: () => ReactElement };
    const queries = { defaultOptions: { queries: { retry: false } } };

    const html = await toServerHtml(page(Doc, new QueryClient(queries)));
    const container = document.createElement('div');
    container.innerHTML = html;
    expect(container.textContent?.length).toBeGreaterThan(0);
    document.body.append(container);
    const errors: string[] = [];
    // React reports a text or structure mismatch as a recoverable error, an attribute mismatch on the console.
    const consoleError = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      const message = args.map(String).join(' ');
      if (/hydrat/i.test(message)) errors.push(message.slice(0, 400));
    });
    const root = await act(async () =>
      hydrateRoot(container, page(Doc, new QueryClient(queries)), {
        onRecoverableError: (error) => errors.push(String(error).slice(0, 400)),
      }),
    );
    consoleError.mockRestore();
    expect(errors).toEqual([]);
    root.unmount();
  });
});
