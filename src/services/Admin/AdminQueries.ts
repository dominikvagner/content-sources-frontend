import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getAdminFeature, getAdminFeatures } from './AdminApi';

export const ADMIN_FEATURE_KEY = 'ADMIN_FEATURE_KEY';
export const ADMIN_FEATURE_ITEM_KEY = 'ADMIN_FEATURE_ITEM_KEY';

export const useAdminFeatureListQuery = () =>
  useQuery({
    queryKey: [ADMIN_FEATURE_KEY],
    queryFn: () => getAdminFeatures(),
    meta: {
      title: 'Unable to get admin features',
      id: 'admin-features-list-error',
    },

    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });

export const useFetchAdminFeatureQuery = (featureName?: string, enabled?: boolean) =>
  useQuery({
    queryKey: [ADMIN_FEATURE_ITEM_KEY, featureName],
    queryFn: () => getAdminFeature(featureName as string),
    meta: {
      title: 'Unable to find an Admin feature with the given featureName: ' + featureName,
      id: 'fetch-feature-error',
    },

    placeholderData: keepPreviousData,
    staleTime: 20000,
    enabled,
  });
