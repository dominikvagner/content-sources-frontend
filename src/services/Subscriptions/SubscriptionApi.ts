import axios from 'axios';

export interface Subscriptions {
  red_hat_enterprise_linux: boolean;
}

export const getSubscriptions: () => Promise<Subscriptions> = async () => {
  const { data } = await axios.get('/api/content-sources/v1/subscription_check/');

  return data;
};
