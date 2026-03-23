import { useQuery } from '@tanstack/react-query';
import { getLifecycle, RoadmapLifecycleResponse } from './RoadmapApi';

export const GET_LIFECYCLE_KEY = 'GET_LIFECYCLE_KEY';

export const useFetchLifecycle = () =>
  useQuery<RoadmapLifecycleResponse>({
    queryKey: [GET_LIFECYCLE_KEY],
    queryFn: getLifecycle,
    meta: {
      title: 'Unable to load end of support dates for RHEL versions.',
      id: 'fetch-roadmap-lifecycle-error',
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
