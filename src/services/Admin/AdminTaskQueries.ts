import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AdminTaskFilterData, getAdminTasks, getAdminTask } from './AdminTaskApi';

export const ADMIN_TASK_LIST_KEY = 'ADMIN_TASK_LIST_KEY';
export const ADMIN_TASK_KEY = 'ADMIN_TASK_KEY';

const ADMIN_TASK_LIST_POLLING_TIME = 15000; // 15 seconds

export const useAdminTaskListQuery = (
  page: number,
  limit: number,
  filterData: AdminTaskFilterData,
  sortBy: string,
  polling: boolean,
) => {
  const flattenedFilterData = Object.values(filterData).flat(1);
  return useQuery({
    queryKey: [ADMIN_TASK_LIST_KEY, page, limit, sortBy, ...flattenedFilterData],
    queryFn: () => getAdminTasks(page, limit, filterData, sortBy),
    meta: {
      title: 'Unable to get admin task list',
      id: 'admin-task-list-error',
    },

    refetchInterval: polling ? ADMIN_TASK_LIST_POLLING_TIME : undefined,

    // This prevents endless polling when our app isn't the focus tab in a browser
    refetchIntervalInBackground: false,

    // If polling and navigate to another tab, on refocus, we want to poll once more. (This is based off of the stalestime below)
    refetchOnWindowFocus: polling,

    placeholderData: keepPreviousData,
    staleTime: 20000,
  });
};

export const useFetchAdminTaskQuery = (uuid?: string) =>
  useQuery({
    queryKey: [ADMIN_TASK_KEY, uuid],
    queryFn: () => getAdminTask(uuid as string),
    meta: {
      title: 'Unable to find an Admin task with the given UUID.',
      id: 'fetch-admin-task-error',
    },
    placeholderData: keepPreviousData,
    staleTime: 20000,
  });
