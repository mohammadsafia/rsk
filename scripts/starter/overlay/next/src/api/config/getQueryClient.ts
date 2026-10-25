import { isServer, type QueryClient } from '@tanstack/react-query';

import { createQueryClient } from './QueryClient';

/** A server-rendered page's data is fresh when it arrives: no refetch right after hydrating. */
const SERVER_RENDERED_STALE_TIME = 60_000;

let browserClient: QueryClient | undefined;

/** A server-rendering app's cache: a new one per request on the server, one for the page's life in the browser. */
export function getQueryClient(): QueryClient {
  if (isServer) return createQueryClient(SERVER_RENDERED_STALE_TIME);
  return (browserClient ??= createQueryClient(SERVER_RENDERED_STALE_TIME));
}
