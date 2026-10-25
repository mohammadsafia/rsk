'use client';

import { type ReactElement, type ReactNode, useState } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { QueryClientProvider } from '@tanstack/react-query';
import { createInstance, type ResourceLanguage } from 'i18next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { Tooltip } from '@components/ui';

import { AppDirectionProvider, type KitLanguage, MotionProvider, ThemeProvider } from '@contexts';

import { getQueryClient } from '@api/config/getQueryClient';
import { NextKitRouterProvider } from '@routes/routerAdapter';

type ProvidersProps = {
  lang: KitLanguage;
  /** This language's translations only: the server sends what the page needs, not every locale. */
  resources: ResourceLanguage;
  children: ReactNode;
};

/** Per request on the server, once in the browser: i18n and the query cache are never shared between visitors. */
export function Providers({ lang, resources, children }: ProvidersProps): ReactElement {
  const [i18n] = useState(() => {
    const instance = createInstance();
    void instance.use(initReactI18next).init({
      lng: lang,
      fallbackLng: lang,
      resources: { [lang]: resources },
      defaultNS: 'common',
      ns: Object.keys(resources),
      interpolation: { escapeValue: false },
      initAsync: false,
    });
    return instance;
  });
  const queryClient = getQueryClient();

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <ThemeProvider>
            <AppDirectionProvider>
              <MotionProvider>
                <NextKitRouterProvider>
                  <Tooltip.Provider delayDuration={300}>{children}</Tooltip.Provider>
                </NextKitRouterProvider>
              </MotionProvider>
            </AppDirectionProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
