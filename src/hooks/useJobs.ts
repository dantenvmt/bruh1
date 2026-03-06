import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchJobs } from '../api/client';
import type { JobsQueryParams, JobsResponse } from '../api/types';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

interface PageParam {
  cursor?: string;
  as_of?: string;
  offset?: number; // Legacy pagination
}

/**
 * Determine if the API response uses cursor-based pagination
 */
function usesCursorPagination(response: JobsResponse): boolean {
  return response.has_more !== undefined && response.next_cursor !== undefined;
}

export function useJobsFeed(params: Omit<JobsQueryParams, 'cursor' | 'as_of' | 'offset'>) {
  return useInfiniteQuery({
    queryKey: ['jobs', 'feed', params],
    queryFn: async ({ pageParam }) => {
      // Support both cursor and offset pagination
      const queryParams: JobsQueryParams = {
        ...params,
        limit: DEFAULT_PAGE_SIZE,
      };

      if (pageParam?.cursor) {
        // New cursor-based pagination
        queryParams.cursor = pageParam.cursor;
        queryParams.as_of = pageParam.as_of;
      } else if (pageParam?.offset !== undefined) {
        // Legacy offset pagination
        queryParams.offset = pageParam.offset;
      }

      return fetchJobs(queryParams);
    },
    getNextPageParam: (lastPage, allPages): PageParam | undefined => {
      // New cursor-based pagination
      if (usesCursorPagination(lastPage)) {
        if (!lastPage.has_more || !lastPage.next_cursor) return undefined;
        return { cursor: lastPage.next_cursor, as_of: lastPage.as_of };
      }

      // Legacy offset pagination - calculate next offset
      const totalItems = allPages.reduce((sum, page) => sum + page.items.length, 0);
      const limit = lastPage.limit ?? DEFAULT_PAGE_SIZE;

      // If we got fewer items than limit, we're at the end
      if (lastPage.items.length < limit) return undefined;

      return { offset: totalItems };
    },
    initialPageParam: {} as PageParam,
    staleTime: Infinity,
  });
}

export function useJobsList(params: Omit<JobsQueryParams, 'cursor' | 'as_of' | 'offset'>) {
  const query = useJobsFeed(params);
  const jobs = query.data?.pages.flatMap(page => page.items) ?? [];
  const asOf = query.data?.pages[0]?.as_of;
  return { ...query, jobs, asOf };
}
