import { useState } from 'react';
import { Subscriptions, getSubscriptions } from './SubscriptionApi';
import useErrorNotification from 'Hooks/useErrorNotification';

export const useFetchSubscriptionsQuery = () => {
  const [isLoading, setIsLoading] = useState(false);
  const errorNotifier = useErrorNotification();

  const fetchSubscriptions = async (): Promise<Subscriptions | null> => {
    setIsLoading(true);
    let subscriptions: Subscriptions | null = null;
    try {
      subscriptions = await getSubscriptions();
    } catch (err) {
      errorNotifier(
        'Error fetching subscriptions',
        'An error occurred',
        err,
        'fetch-subscriptions-error',
      );
    }
    setIsLoading(false);
    return subscriptions;
  };

  return { fetchSubscriptions, isLoading };
};
