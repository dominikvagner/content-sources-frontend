import { Subscriptions, getSubscriptions } from './SubscriptionApi';
import useErrorNotification from 'Hooks/useErrorNotification';
import { useQuery } from 'react-query';

const SUBSCRIPTION_CHECK_KEY = 'SUBSCRIPTION_CHECK_KEY';

export const useFetchSubscriptionsQuery = () => {
  const errorNotifier = useErrorNotification();
  return useQuery<Subscriptions>([SUBSCRIPTION_CHECK_KEY], () => getSubscriptions(), {
    onError: (err) =>
      errorNotifier(
        'Error fetching subscriptions',
        'An error occurred',
        err,
        'fetch-subscriptions-error',
      ),
  });
};
