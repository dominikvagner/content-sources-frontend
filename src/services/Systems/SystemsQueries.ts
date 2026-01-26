import useErrorNotification from 'Hooks/useErrorNotification';
import {
  addTemplateToSystems,
  getSystemsList,
  getTemplateSystemCounts,
  listSystemsByTemplateId,
  deleteTemplateFromSystems,
  type SystemsFilters,
  listTags,
} from './SystemsApi';
import { keepPreviousData, useMutation, useQuery, type QueryClient } from '@tanstack/react-query';
import useNotification from 'Hooks/useNotification';
import { AlertVariant } from '@patternfly/react-core';

export const GET_SYSTEMS_KEY = 'GET_SYSTEMS_KEY';
export const GET_TEMPLATE_SYSTEMS_KEY = 'GET_TEMPLATE_SYSTEMS_KEY';
export const TEMPLATE_SYSTEM_COUNTS_KEY = 'TEMPLATE_SYSTEM_COUNTS_KEY';

export const useSystemsListQuery = (
  page: number,
  limit: number,
  searchQuery: string,
  filter: SystemsFilters,
  sortBy?: string,
) =>
  useQuery({
    queryKey: [GET_SYSTEMS_KEY, page, limit, searchQuery, filter, sortBy],
    queryFn: () => getSystemsList(page, limit, searchQuery, filter, sortBy),
    placeholderData: keepPreviousData,
    staleTime: 60000,
    meta: {
      title: 'Unable to get systems.',
      id: 'systems-list-error',
    },
  });

export const useTagsQuery = (page: number, limit: number, search?: string) =>
  useQuery({
    queryKey: ['TAGS', page, limit, search],
    queryFn: () => listTags(page, limit, search),
    placeholderData: keepPreviousData,

    meta: {
      title: 'Unable to get tags',
      id: 'tags-err',
    },
  });

export const useListSystemsByTemplateId = (
  id: string,
  page: number,
  limit: number,
  searchQuery: string,
  sortBy?: string,
) =>
  useQuery({
    queryKey: [GET_TEMPLATE_SYSTEMS_KEY, id, page, limit, searchQuery, sortBy],
    queryFn: () => listSystemsByTemplateId(id, page, limit, searchQuery, sortBy),
    placeholderData: keepPreviousData,
    staleTime: 25_000,
    refetchOnWindowFocus: 'always',
    refetchOnMount: 'always',
    refetchInterval: 20_000,
    meta: {
      title: 'Unable to fetch systems assigned to this template',
      id: 'systems-list-error',
    },
  });

export const useAddTemplateToSystemsQuery = (
  queryClient: QueryClient,
  templateId: string,
  systemUUIDs: string[],
) => {
  const errorNotifier = useErrorNotification();
  const { notify } = useNotification();
  return useMutation({
    mutationFn: () => addTemplateToSystems(templateId, systemUUIDs),

    onSuccess: () => {
      notify({
        variant: AlertVariant.success,
        title: `Template successfully added to ${systemUUIDs.length} system${systemUUIDs.length > 1 ? 's' : ''}`,
      });

      queryClient.invalidateQueries({ queryKey: [GET_SYSTEMS_KEY] });
      queryClient.invalidateQueries({ queryKey: [GET_TEMPLATE_SYSTEMS_KEY] });
      queryClient.invalidateQueries({ queryKey: [TEMPLATE_SYSTEM_COUNTS_KEY] });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      errorNotifier(
        'Error adding template to system(s)',
        'An error occurred',
        err,
        'add-template-to-system-error',
      );
    },
  });
};

export const useDeleteTemplateFromSystems = (queryClient: QueryClient) => {
  const errorNotifier = useErrorNotification();
  return useMutation({
    mutationFn: deleteTemplateFromSystems,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GET_SYSTEMS_KEY] });
      queryClient.invalidateQueries({ queryKey: [GET_TEMPLATE_SYSTEMS_KEY] });
      queryClient.invalidateQueries({ queryKey: [TEMPLATE_SYSTEM_COUNTS_KEY] });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      errorNotifier(
        'Unable to unassign template from system.',
        'An error occurred',
        err,
        'remove-template-from-system-error',
      );
    },
  });
};

export const useTemplateSystemCounts = (templateUuids: string[]) =>
  useQuery<Record<string, number>>({
    queryKey: [TEMPLATE_SYSTEM_COUNTS_KEY, ...templateUuids],
    queryFn: () => getTemplateSystemCounts(templateUuids),
    placeholderData: keepPreviousData,
    staleTime: 25_000,
    refetchInterval: 20_000,
    enabled: templateUuids.length > 0,
    meta: {
      title: 'Unable to get system counts for templates',
      id: 'template-system-counts-error',
    },
  });
