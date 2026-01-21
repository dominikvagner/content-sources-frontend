import { useQuery } from '@tanstack/react-query';

import useErrorNotification from 'Hooks/useErrorNotification';
import {
  getAdminFeature,
  getAdminFeatures,
  type AdminFeature,
  type AdminFeatures,
} from './AdminApi';

export const ADMIN_FEATURE_KEY = 'ADMIN_FEATURE_KEY';
export const ADMIN_FEATURE_ITEM_KEY = 'ADMIN_FEATURE_ITEM_KEY';

export const useAdminFeatureListQuery = () => {
  const errorNotifier = useErrorNotification();
  return useQuery<AdminFeatures>([ADMIN_FEATURE_KEY], () => getAdminFeatures(), {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      errorNotifier(
        'Unable to get admin features',
        'An error occurred',
        err,
        'admin-features-list-error',
      );
    },
    keepPreviousData: true,
    staleTime: Infinity,
  });
};

export const useFetchAdminFeatureQuery = (featureName?: string, enabled?: boolean) => {
  const errorNotifier = useErrorNotification();
  return useQuery<AdminFeature[]>(
    [ADMIN_FEATURE_ITEM_KEY, featureName],
    () => getAdminFeature(featureName as string), // Will be disabled if undefined
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (err: any) => {
        errorNotifier(
          'Unable to find an Admin feature with the given featureName: ' + featureName,
          'An error occurred',
          err,
          'fetch-feature-error',
        );
      },
      keepPreviousData: true,
      staleTime: 20000,
      enabled,
    },
  );
};
