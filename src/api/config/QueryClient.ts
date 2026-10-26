import { QueryClient } from '@tanstack/react-query';

/** The app's query cache settings. `staleTime`: how long fetched data counts as fresh (0: refetch on each mount). */
export const createQueryClient = (staleTime = 0): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime,
      },
    },
  });

/** The Vite app's one cache. */
export const queryClient = createQueryClient();
