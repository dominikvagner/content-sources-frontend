import { Subscriptions, getSubscriptions } from './SubscriptionApi';
import useErrorNotification from 'Hooks/useErrorNotification';
import { useQuery } from 'react-query';

const SUBSCRIPTION_CHECK_KEY = 'SUBSCRIPTION_CHECK_KEY';

export const useFetchSubscriptionsQuery = () => {
  const errorNotifier = useErrorNotification();
  const { data: fetchSubscriptions, isLoading } = useQuery<Subscriptions>(
    [SUBSCRIPTION_CHECK_KEY],
    () => getSubscriptions(),
    {
      keepPreviousData: true,
      optimisticResults: true,
      staleTime: 60000,
      onError: (err) =>
        errorNotifier(
          'Error fetching subscriptions',
          'An error occurred',
          err,
          'fetch-subscriptions-error',
        ),
    },
  );

  return { fetchSubscriptions, isLoading };
};
