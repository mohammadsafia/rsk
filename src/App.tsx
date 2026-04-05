import React from 'react';
import { AuthProvider } from 'react-oidc-context';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { CssBaseline, StyledEngineProvider, ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { ToastContainer } from 'react-toastify';
import { NuqsAdapter } from 'nuqs/adapters/react';
import { store, StoreContext } from 'stores';
import { oidcConfig } from 'config';
import { TokenUtils } from 'utils';
import { queryClient, UserDataInitializer } from 'layout';
import { ConfirmModalContainer } from 'components/common';
import { DownloadLoader } from 'components/app-loader';
import AuthManager from 'components/auth/AuthManager';
import theme from 'themes';

import { router } from './routes/router';

import 'react-toastify/dist/ReactToastify.css';
import 'assets/scss/style.scss';

TokenUtils.initialize();

type AppProps = {};
const App: React.FC<AppProps> = () => {
  const oidcConfigWithDebug = {
    ...oidcConfig,
    // Clear URL parameters after processing to prevent infinite loop
    onSigninCallback: () => {
      window.history.replaceState({}, document.title, window.location.pathname);
    },
  };

  return (
    <AuthProvider {...oidcConfigWithDebug}>
      <AuthManager>
        <NuqsAdapter>
          <StoreContext.Provider value={store}>
            <QueryClientProvider client={queryClient}>
              <ReactQueryDevtools initialIsOpen={false} position="bottom-left" />

              <UserDataInitializer>
                <StyledEngineProvider injectFirst>
                  <LocalizationProvider dateAdapter={AdapterMoment}>
                    <ThemeProvider theme={theme()}>
                      <ConfirmModalContainer />
                      <DownloadLoader />
                      <CssBaseline />
                      <ToastContainer
                        style={{
                          width: 'fit-content',
                          maxWidth: '500px',
                          minWidth: '300px',
                        }}
                        position="top-right"
                      />
                      <RouterProvider router={router} />
                    </ThemeProvider>
                  </LocalizationProvider>
                </StyledEngineProvider>
              </UserDataInitializer>
            </QueryClientProvider>
          </StoreContext.Provider>
        </NuqsAdapter>
      </AuthManager>
    </AuthProvider>
  );
};

export default App;
