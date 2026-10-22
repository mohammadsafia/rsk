import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/react';

import { queryClient } from '@api/config';
import { ROUTER } from '@routes';
import { ReactRouterKitProvider } from '@routes/routerAdapter';
import { AppDirectionProvider, AuthProvider, MotionProvider, ThemeProvider } from '@contexts';
import { Tooltip } from '@components/ui';

import './i18n';
import './index.css';

/** When a session ends, nothing the last user loaded may show to the next one. */
const clearUserData = () => {
  void queryClient.cancelQueries();
  queryClient.clear();
};

export function renderApp(container: HTMLElement) {
  createRoot(container).render(
    <StrictMode>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AppDirectionProvider>
            <MotionProvider>
              <NuqsAdapter>
                <Tooltip.Provider delayDuration={300}>
                  <AuthProvider onSignOut={clearUserData}>
                    <ReactRouterKitProvider>
                      <RouterProvider router={ROUTER} />
                    </ReactRouterKitProvider>
                  </AuthProvider>
                </Tooltip.Provider>
              </NuqsAdapter>
            </MotionProvider>
          </AppDirectionProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}
