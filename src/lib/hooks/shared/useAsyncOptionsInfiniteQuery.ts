import { useInfiniteQuery } from '@tanstack/react-query';

import type { PaginatedDataTable } from '@app-types';

export type AsyncOptionsFn<TOption> = (queryParams: string) => Promise<TOption[] | PaginatedDataTable<TOption>>;

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
   * Array of selected item IDs — sent to the BE so selected items appear on top of results.
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
  return useInfiniteQuery({
    queryKey: [queryKey, searchTerm, urlSearchParams?.toString()],
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams = new URLSearchParams();

      // Parse urlSearchParams if provided as string
      if (urlSearchParams) {
        const baseParams = typeof urlSearchParams === 'string' ? new URLSearchParams(urlSearchParams) : urlSearchParams;

        for (const [key, val] of baseParams.entries()) {
          queryParams.append(key, val);
        }
      }

      queryParams.append('pageNumber', pageParam.toString());
      queryParams.append('pageSize', pageSize.toString());

      if (searchTerm) {
        queryParams.append('searchTerm', searchTerm);
      }

      selectedItemsIds.forEach((id: string) => {
        queryParams.append('selectedItemsIds', id);
      });

      const response = await fetchOptions(queryParams.toString());

      if (Array.isArray(response)) {
        return { data: response, pagination: { page: 1, pageSize: response.length, total: response.length, totalPages: 1 } };
      }

      return response;
    },
    getNextPageParam: (lastPage, pages) => {
      const totalLoaded = pages.length * pageSize;
      return totalLoaded < lastPage.pagination.total ? pages.length + 1 : undefined;
    },
    enabled,
    keepPreviousData: true,
    staleTime: 0,
    cacheTime: 0,
  });
}
