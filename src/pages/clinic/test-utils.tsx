import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';

import { clinicStore } from '@api/clinic';
import { Tooltip } from '@components/ui';
import { ReactRouterKitProvider } from '@routes/routerAdapter';

/** A fixed clinic for tests: Friday 16 Oct 2026, 09:00, no latency, fresh seed. */
export const CLINIC_TEST_NOW = new Date(2026, 9, 16, 9, 0);

export const resetClinic = () => {
  sessionStorage.clear();
  clinicStore.setClock(() => CLINIC_TEST_NOW);
  clinicStore.setLatency([0, 0]);
  clinicStore.reset();
};

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

/** Renders a clinic page with the app's providers; any navigation away lands on a location probe. */
/**
 * `outside` renders next to the routes (like the app's global Toaster), so it survives a page navigating away.
 * `urlMemory` keeps URL writes (nuqs `hasMemory`) for tests that read back what a page wrote. It is opt-in:
 * the testing adapter's memory can carry state between tests in one file.
 */
export const renderClinic = (
  ui: ReactElement,
  { route = '/', path = '*', outside, urlMemory = false }: { route?: string; path?: string; outside?: ReactNode; urlMemory?: boolean } = {},
) =>
  render(
    // nuqs reads its own copy of the query string; give it the route's so ?range=… etc. reach the page.
    <NuqsTestingAdapter searchParams={new URL(route, 'http://clinic.test').search} hasMemory={urlMemory}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}>
        <Tooltip.Provider>
          <ReactRouterKitProvider>
            <MemoryRouter initialEntries={[route]}>
              <Routes>
                <Route path={path} element={ui} />
                <Route path="*" element={<LocationProbe />} />
              </Routes>
              {outside}
            </MemoryRouter>
          </ReactRouterKitProvider>
        </Tooltip.Provider>
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  );
