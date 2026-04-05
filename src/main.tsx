import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@api/config';
import { ROUTER } from '@routes';
import { ThemeProvider } from '@contexts';

import './index.css';

import { NuqsAdapter } from 'nuqs/adapters/react';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <RouterProvider router={ROUTER} future={{ v7_startTransition: true }} />
        </NuqsAdapter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
