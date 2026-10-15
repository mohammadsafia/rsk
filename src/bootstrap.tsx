import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/react';

import { queryClient } from '@api/config';
import { ROUTER } from '@routes';
import { AppDirectionProvider, ThemeProvider } from '@contexts';
import { Tooltip } from '@components/ui';

import './i18n';
import './index.css';

export function renderApp(container: HTMLElement) {
  createRoot(container).render(
    <StrictMode>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AppDirectionProvider>
            <NuqsAdapter>
              <Tooltip.Provider delayDuration={300}>
                <RouterProvider router={ROUTER} future={{ v7_startTransition: true }} />
              </Tooltip.Provider>
            </NuqsAdapter>
          </AppDirectionProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}
