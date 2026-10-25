import { isServer, QueryClient } from '@tanstack/react-query';

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

/** A server-rendered page's data is fresh when it arrives: no refetch right after hydrating. */
const SERVER_RENDERED_STALE_TIME = 60_000;

let browserClient: QueryClient | undefined;

/** A server-rendering app's cache: a new one per request on the server, one for the page's life in the browser. */
export function getQueryClient(): QueryClient {
  if (isServer) return createQueryClient(SERVER_RENDERED_STALE_TIME);
  return (browserClient ??= createQueryClient(SERVER_RENDERED_STALE_TIME));
}
