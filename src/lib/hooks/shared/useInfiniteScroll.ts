import { useCallback } from 'react';
import type { UseInfiniteQueryResult } from '@tanstack/react-query';

type UseInfiniteScrollOptions<TData = any, TError = unknown> = {
  /**
   * The infinite query result from useInfiniteQuery
   */
  infiniteQuery: UseInfiniteQueryResult<TData, TError>;
  /**
   * Whether infinite scroll should be enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Distance from bottom (in pixels) to trigger loading more
   * @default 100
   */
  threshold?: number;
};

type UseInfiniteScrollReturn = {
  /**
   * Scroll event handler to attach to the scrollable container
   */
  handleScroll: (event: React.UIEvent<HTMLDivElement>) => void;
};

/**
 * Hook for handling infinite scroll pagination
 *
 * Automatically loads the next page when user scrolls near the bottom of the container.
 *
 * @example
 * ```tsx
 * const infiniteQuery = useInfiniteQuery({ ... });
 * const { handleScroll } = useInfiniteScroll({
 *   infiniteQuery,
 *   enabled: isAsyncOptions,
 * });
 *
 * <Command.List onScroll={handleScroll}>
 *   {items.map(item => <Command.Item key={item.id}>{item.name}</Command.Item>)}
 * </Command.List>
 * ```
 */
export function useInfiniteScroll<TData = any, TError = unknown>({
  infiniteQuery,
  enabled = true,
  threshold = 100,
}: UseInfiniteScrollOptions<TData, TError>): UseInfiniteScrollReturn {
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!enabled) return;

      const listNode = event.currentTarget;
      const scrollBottom = listNode.scrollHeight - listNode.scrollTop - listNode.clientHeight;

      if (scrollBottom < threshold && infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage) {
        infiniteQuery.fetchNextPage();
      }
    },
    [enabled, threshold, infiniteQuery.hasNextPage, infiniteQuery.isFetchingNextPage, infiniteQuery.fetchNextPage],
  );

  return {
    handleScroll,
  };
}
