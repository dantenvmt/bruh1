import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { JobsQueryParams } from '@/api/types';

export function useRecommendedJobs(params?: JobsQueryParams) {
  const query = useQuery({
    queryKey: ['recommended-jobs', params],
    queryFn: () => api.jobs.recommended(params),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });

  return {
    jobs: query.data?.items ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
