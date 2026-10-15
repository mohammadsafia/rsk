import { type ReactNode, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Tooltip } from '@components/ui';

type FormHarnessProps = {
  defaultValues: Record<string, unknown>;
  /** Field name → error message, applied after mount. */
  errors?: Record<string, string>;
  children: ReactNode;
};

/** Test-only wrapper: providers a field needs plus a form with optional pre-set errors. */
export function FormHarness({ defaultValues, errors = {}, children }: FormHarnessProps) {
  const methods = useForm({ defaultValues });
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    for (const [name, message] of Object.entries(errors)) methods.setError(name, { type: 'manual', message });
  }, [methods, errors]);

  return (
    <QueryClientProvider client={queryClient}>
      <Tooltip.Provider>
        <FormProvider {...methods}>{children}</FormProvider>
      </Tooltip.Provider>
    </QueryClientProvider>
  );
}
