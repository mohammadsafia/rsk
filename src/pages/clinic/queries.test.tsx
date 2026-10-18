// @vitest-environment happy-dom
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { clinicStore } from '@api/clinic';

import { usePatients, useRegisterPatient, useVisits } from './queries';
import { resetClinic } from './test-utils';

beforeEach(resetClinic);
afterEach(() => clinicStore.setClock(null));

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>
);

describe('clinic queries', () => {
  it('loads patients through the handlers', async () => {
    const { result } = renderHook(() => usePatients(), { wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(60));
  });

  it('refreshes the patient list after a registration', async () => {
    const { result } = renderHook(() => ({ list: usePatients(), register: useRegisterPatient() }), { wrapper });
    await waitFor(() => expect(result.current.list.data).toHaveLength(60));
    const template = clinicStore.read().patients[0];
    await act(async () => {
      await result.current.register.mutateAsync({ ...template, phone: '+962 79 000 0001' });
    });
    await waitFor(() => expect(result.current.list.data).toHaveLength(61));
  });

  it('surfaces a ClinicError from a failed request', async () => {
    clinicStore.failNext('listPatients');
    const { result } = renderHook(() => usePatients(), { wrapper });
    await waitFor(() => expect(result.current.error).toMatchObject({ code: 'forced' }));
  });

  it('keeps the previous range visible while the next one loads (Query 5 placeholderData)', async () => {
    const { result, rerender } = renderHook(({ from, to }) => useVisits({ from, to }, { keepPreviousData: true }), {
      wrapper,
      initialProps: { from: '2026-10-12', to: '2026-10-18' },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const first = result.current.data;
    rerender({ from: '2026-10-19', to: '2026-10-25' });
    expect(result.current.data).toBe(first);
    expect(result.current.isPlaceholderData).toBe(true);
  });
});
