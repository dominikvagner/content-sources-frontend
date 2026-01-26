import { getSubscriptions, getEphemeralSubscriptions } from './SubscriptionApi';
import useIsEphemeralEnv from 'Hooks/useIsEphemeralEnv';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

const SUBSCRIPTION_CHECK_KEY = 'SUBSCRIPTION_CHECK_KEY';

export const useFetchSubscriptionsQuery = () => {
  const isEphemeral = useIsEphemeralEnv();
  const queryFn = useMemo(
    () => (isEphemeral ? getEphemeralSubscriptions() : getSubscriptions()),
    [isEphemeral],
  );

  return useQuery({
    queryKey: [SUBSCRIPTION_CHECK_KEY],
    queryFn: () => queryFn,
    meta: {
      title: 'Error fetching subscriptions',
      id: 'fetch-subscriptions-error',
    },
  });
};
