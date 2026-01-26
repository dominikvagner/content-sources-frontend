import { keepPreviousData, QueryClient, useMutation, useQuery } from '@tanstack/react-query';

import useErrorNotification from 'Hooks/useErrorNotification';
import {
  TemplateFilterData,
  fetchTemplate,
  getTemplates,
  TemplateCollectionResponse,
  createTemplate,
  TemplateRequest,
  deleteTemplateItem,
  EditTemplateRequest,
  EditTemplate,
  getTemplatePackages,
  getTemplateErrata,
  getTemplateSnapshots,
  getTemplatesForSnapshots,
} from './TemplateApi';
import useNotification from 'Hooks/useNotification';
import { AlertVariant } from '@patternfly/react-core';

export const FETCH_TEMPLATE_KEY = 'FETCH_TEMPLATE_KEY';
export const GET_TEMPLATES_KEY = 'GET_TEMPLATES_KEY';
export const GET_TEMPLATE_PACKAGES_KEY = 'GET_TEMPLATE_PACKAGES_KEY';
export const TEMPLATE_ERRATA_KEY = 'TEMPLATE_ERRATA_KEY';
export const TEMPLATE_SNAPSHOTS_KEY = 'TEMPLATE_SNAPSHOTS_KEY';
export const TEMPLATES_FOR_SNAPSHOTS = 'TEMPLATES_BY_SNAPSHOTS_KEY';

const TEMPLATE_LIST_POLLING_TIME = 15000; // 15 seconds
const TEMPLATE_FETCH_POLLING_TIME = 5000; // 5 seconds

export const useEditTemplateQuery = (queryClient: QueryClient, request: EditTemplateRequest) => {
  const errorNotifier = useErrorNotification();
  const { notify } = useNotification();
  return useMutation({
    mutationFn: () => EditTemplate(request),

    onSuccess: () => {
      notify({
        variant: AlertVariant.success,
        title: `Successfully edited template '${request.name}'`,
      });

      queryClient.invalidateQueries({ queryKey: [GET_TEMPLATES_KEY] });
      queryClient.invalidateQueries({ queryKey: [FETCH_TEMPLATE_KEY] });
      queryClient.invalidateQueries({ queryKey: [GET_TEMPLATE_PACKAGES_KEY] });
      queryClient.invalidateQueries({ queryKey: [TEMPLATE_ERRATA_KEY] });
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_FOR_SNAPSHOTS] });
      queryClient.invalidateQueries({ queryKey: [TEMPLATE_SNAPSHOTS_KEY] });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      errorNotifier(
        `Error editing template '${request.name}'`,
        'An error occurred',
        err,
        'edit-template-error',
      );
    },
  });
};

export const useFetchTemplate = (uuid: string, enabled: boolean = true, polling: boolean = false) =>
  useQuery({
    queryKey: [FETCH_TEMPLATE_KEY, uuid],
    queryFn: () => fetchTemplate(uuid),
    meta: {
      title: 'Unable to find associated content template.',
      id: 'fetch-template-error',
    },
    refetchInterval: polling ? TEMPLATE_FETCH_POLLING_TIME : undefined,
    placeholderData: keepPreviousData,
    staleTime: 20000,
    enabled,
  });

export const useFetchTemplatePackages = (
  page: number,
  limit: number,
  search: string,
  uuid: string,
) =>
  useQuery({
    queryKey: [GET_TEMPLATE_PACKAGES_KEY, page, limit, search, uuid],
    queryFn: () => getTemplatePackages(page, limit, search, uuid),
    meta: {
      title: 'Unable to find associated packages for content template.',
      id: 'fetch-packages-template-error',
    },
    placeholderData: keepPreviousData,
    staleTime: 60000,
  });

export const useFetchTemplateErrataQuery = (
  uuid: string,
  page: number,
  limit: number,
  search: string,
  type: string[],
  severity: string[],
  sortBy: string,
) =>
  useQuery({
    queryKey: [TEMPLATE_ERRATA_KEY, uuid, page, limit, search, type, severity, sortBy],
    queryFn: () => getTemplateErrata(uuid, page, limit, search, type, severity, sortBy),
    meta: {
      title: 'Unable to find errata with the given UUID.',
      id: 'Template-errata-list-error',
    },
    placeholderData: keepPreviousData,
    staleTime: 60000,
  });

export const useFetchTemplateSnapshotsQuery = (
  uuid: string,
  page: number,
  limit: number,
  search: string,
  sortBy: string,
) =>
  useQuery({
    queryKey: [TEMPLATE_SNAPSHOTS_KEY, uuid, page, limit, search, sortBy],
    queryFn: () => getTemplateSnapshots(uuid, page, limit, search, sortBy),
    meta: {
      title: 'Unable to find snapshots for the given template UUID.',
      id: 'template-snapshots-list-error',
    },
    placeholderData: keepPreviousData,
    staleTime: 60000,
  });

export const useFetchTemplatesForSnapshots = (repoUuid: string, snapshotUuids: string[]) =>
  useQuery({
    queryKey: [TEMPLATES_FOR_SNAPSHOTS, repoUuid, ...snapshotUuids],
    queryFn: () => getTemplatesForSnapshots(snapshotUuids),
    meta: {
      title: 'Unable to find templates for the given snapshots.',
      id: 'template-for-snapshots-error',
    },
    placeholderData: keepPreviousData,
    staleTime: 20000,
  });

export const useTemplateList = (
  page: number,
  limit: number,
  sortBy: string,
  filterData: TemplateFilterData,
  polling: boolean = false,
) =>
  useQuery({
    // Below MUST match the "templateListKeyArray" seen below (once written) in the useDeleteTemplate.
    queryKey: [GET_TEMPLATES_KEY, page, limit, sortBy, ...Object.values(filterData)],
    queryFn: () => getTemplates(page, limit, sortBy, filterData),
    meta: {
      title: 'Unable to get content template list',
      id: 'template-list-error',
    },
    refetchInterval: polling ? TEMPLATE_LIST_POLLING_TIME : undefined,
    placeholderData: keepPreviousData,
    staleTime: 20000,
  });

export const useCreateTemplateQuery = (queryClient: QueryClient, request: TemplateRequest) => {
  const errorNotifier = useErrorNotification();
  const { notify } = useNotification();
  return useMutation({
    mutationFn: () => createTemplate(request),

    onSuccess: () => {
      notify({
        variant: AlertVariant.success,
        title: `Content Template "${request?.name}" created`,
      });

      queryClient.invalidateQueries({ queryKey: [GET_TEMPLATES_KEY] });
      queryClient.invalidateQueries({ queryKey: [FETCH_TEMPLATE_KEY] });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      errorNotifier(
        'Error creating content template',
        'An error occurred',
        err,
        'create-template-error',
      );
    },
  });
};

export const useDeleteTemplateItemMutate = (queryClient: QueryClient) => {
  // Below MUST match the "useTemplateList" key found above or updates will fail.
  const contentListKeyArray = [GET_TEMPLATES_KEY];
  const errorNotifier = useErrorNotification();
  return useMutation({
    mutationFn: deleteTemplateItem,
    onMutate: async (uuid: string) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: contentListKeyArray });
      // Snapshot the previous value
      const previousData: Partial<TemplateCollectionResponse> =
        queryClient.getQueryData(contentListKeyArray) || {};

      // Optimistically update to the new value
      queryClient.setQueryData(contentListKeyArray, () => ({
        ...previousData,
        data: previousData.data?.filter((data) => uuid !== data.uuid),
        meta: previousData.meta
          ? {
              ...previousData.meta,
              count: previousData.meta.count ? previousData.meta.count - 1 : 1,
            }
          : undefined,
      }));
      // Return a context object with the snapshotted value
      return { previousData, queryClient };
    },
    onSuccess: (_data, _variables, context) => {
      // Update all of the existing calls "count" to prevent number jumping on pagination
      const { previousData } = context as {
        previousData: TemplateCollectionResponse;
      };
      queryClient.setQueriesData(
        { queryKey: [GET_TEMPLATES_KEY] },
        (data: Partial<TemplateCollectionResponse> = {}) => {
          if (data?.meta?.count) {
            data.meta.count = previousData?.meta?.count - 1;
          }

          return data;
        },
      );
      queryClient.invalidateQueries({ queryKey: [GET_TEMPLATES_KEY] });
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any, _newData, context) => {
      if (context) {
        const { previousData } = context as {
          previousData: TemplateCollectionResponse;
        };
        queryClient.setQueryData(contentListKeyArray, previousData);
      }
      errorNotifier(
        'Unable to delete the given template.',
        'An error occurred',
        err,
        'delete-template-error',
      );
    },
  });
};
