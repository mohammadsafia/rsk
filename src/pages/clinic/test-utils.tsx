import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { clinicStore } from '@api/clinic';
import { Tooltip } from '@components/ui';

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
export const renderClinic = (ui: ReactElement, { route = '/', path = '*' }: { route?: string; path?: string } = {}) =>
  render(
    <NuqsTestingAdapter>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } })}>
        <Tooltip.Provider>
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route path={path} element={ui} />
              <Route path="*" element={<LocationProbe />} />
            </Routes>
          </MemoryRouter>
        </Tooltip.Provider>
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  );
