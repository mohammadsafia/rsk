// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { MDXProvider } from '@mdx-js/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { MemoryRouter } from 'react-router-dom';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

import { Tooltip } from '@components/ui';
import { ThemeProvider } from '@contexts';

import { getComponentDocsRegistry } from '@component-docs/registry';
import { mdxComponents } from '@component-docs/gallery/utils';

import '../../i18n';

// Every docs page must render without throwing or logging a React error, so a broken example
// is caught here rather than in the browser.
const errors: string[] = [];
let spy: ReturnType<typeof vi.spyOn>;

beforeAll(() => {
  spy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    errors.push(args.map(String).join(' '));
  });
});
afterAll(() => spy.mockRestore());
afterEach(() => {
  cleanup();
  errors.length = 0;
});

describe('every docs page', () => {
  it.each(getComponentDocsRegistry().map((entry) => [entry.id, entry] as const))('%s renders cleanly', async (_id, entry) => {
    const { default: Doc } = await entry.load();

    const { container } = render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <ThemeProvider>
          <NuqsTestingAdapter>
            <MemoryRouter>
              <Tooltip.Provider>
                <MDXProvider components={mdxComponents}>
                  <Doc />
                </MDXProvider>
              </Tooltip.Provider>
            </MemoryRouter>
          </NuqsTestingAdapter>
        </ThemeProvider>
      </QueryClientProvider>,
    );

    expect(container.textContent?.length).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
});
