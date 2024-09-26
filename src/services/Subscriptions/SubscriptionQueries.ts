import { Subscriptions, getSubscriptions, getEphemeralSubscriptions } from './SubscriptionApi';
import useErrorNotification from 'Hooks/useErrorNotification';
import useIsEphemeralEnv from 'Hooks/useIsEphemeralEnv';
import { useQuery } from 'react-query';

const SUBSCRIPTION_CHECK_KEY = 'SUBSCRIPTION_CHECK_KEY';

export const useFetchSubscriptionsQuery = () => {
  const errorNotifier = useErrorNotification();
  const isEphemeral = useIsEphemeralEnv();
  const queryFn = isEphemeral ? getEphemeralSubscriptions() : getSubscriptions();

  return useQuery<Subscriptions>([SUBSCRIPTION_CHECK_KEY], () => queryFn, {
    onError: (err) =>
      errorNotifier(
        'Error fetching subscriptions',
        'An error occurred',
        err,
        'fetch-subscriptions-error',
      ),
  });
};
