export interface Subscriptions {
  RedHatEnterpriseLinux: boolean;
}

export const getSubscriptions: () => Promise<Subscriptions> = async () => {
  // TODO: Change from dummy data when API is ready.
  // const { data } = await axios.get('/api/content-sources/v1/subscription_check/');

  const validRHEL = Math.random() > 0.5;
  const subscriptions = { RedHatEnterpriseLinux: validRHEL } as Subscriptions;
  const data: Promise<Subscriptions> = Promise.resolve(subscriptions);

  return data;
};
