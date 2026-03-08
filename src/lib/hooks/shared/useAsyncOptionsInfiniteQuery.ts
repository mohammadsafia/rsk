import { useInfiniteQuery } from '@tanstack/react-query';

import type { PaginatedResult } from '@app-types';

export type AsyncOptionsFn<TOption> = (queryParams: string) => Promise<PaginatedResult<TOption>>;

type UseAsyncOptionsInfiniteQueryOptions<TOption> = {
  /**
   * The async function that fetches options
   */
  fetchOptions: AsyncOptionsFn<TOption>;
  /**
   * Query key identifier (usually the field name)
   */
  queryKey: string;
  /**
   * Debounced search term
   */
  searchTerm?: string;
  /**
   * Array of selected item IDs to exclude from results
   */
  selectedItemsIds?: string[];
  /**
   * Additional URL search parameters
   */
  urlSearchParams?: URLSearchParams | string;
  /**
   * Number of items per page
   * @default 20
   */
  pageSize?: number;
  /**
   * Whether the query should be enabled
   * @default true
   */
  enabled?: boolean;
};

/**
 * Hook for handling async options fetching with infinite scroll pagination
 *
 * Automatically handles pagination, search, and selected items filtering for async option lists.
 *
 * @example
 * ```tsx
 * const infiniteQuery = useAsyncOptionsInfiniteQuery({
 *   fetchOptions: LookupService.users.request,
 *   queryKey: 'userId',
 *   searchTerm: debouncedSearch,
 *   selectedItemsIds: ['1', '2'],
 *   urlSearchParams: new URLSearchParams({ userTypes: 'DoctorUser' }),
 *   pageSize: 20,
 *   enabled: isAsyncOptions && open,
 * });
 *
 * const allOptions = infiniteQuery.data?.pages.flatMap((page) => page.data) ?? [];
 * ```
 */
export function useAsyncOptionsInfiniteQuery<TOption>({
  fetchOptions,
  queryKey,
  searchTerm = '',
  selectedItemsIds = [],
  urlSearchParams,
  pageSize = 20,
  enabled = true,
}: UseAsyncOptionsInfiniteQueryOptions<TOption>) {
  return useInfiniteQuery<PaginatedResult<TOption>>({
    queryKey: [queryKey, searchTerm, urlSearchParams?.toString()],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const queryParams = new URLSearchParams();

      // Parse urlSearchParams if provided as string
      if (urlSearchParams) {
        const baseParams = typeof urlSearchParams === 'string' ? new URLSearchParams(urlSearchParams) : urlSearchParams;

        for (const [key, val] of baseParams.entries()) {
          queryParams.append(key, val);
        }
      }

      queryParams.append('pageNumber', (pageParam as number).toString());
      queryParams.append('pageSize', pageSize.toString());

      if (searchTerm) {
        queryParams.append('searchTerm', searchTerm);
      }

      selectedItemsIds.forEach((id: string) => {
        queryParams.append('selectedItemsIds', id);
      });

      return fetchOptions(queryParams.toString());
    },
    getNextPageParam: (lastPage: PaginatedResult<TOption>, pages: PaginatedResult<TOption>[]) => {
      const totalLoaded = pages.length * pageSize;
      return totalLoaded < lastPage.pagination.total ? pages.length + 1 : undefined;
    },
    enabled,
    staleTime: Infinity,
  });
}
