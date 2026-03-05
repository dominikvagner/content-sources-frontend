import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Features } from 'services/Features/FeatureApi';
import { useFetchFeaturesQuery } from 'services/Features/FeatureQueries';
import { ContentOrigin } from 'services/Content/ContentApi';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { ChromeAPI } from '@redhat-cloud-services/types';
import { Subscriptions } from 'services/Subscriptions/SubscriptionApi';
import { useFetchSubscriptionsQuery } from 'services/Subscriptions/SubscriptionQueries';
import { useFlag } from '@unleash/proxy-client-react';
import { useKesselWorkspace, useKesselRbac, useTraditionalRbac } from './rbacHelpers';

// Add permissions here
export enum RbacPermissions {
  'repoRead', // If the user doesn't have this permission, they won't see the app, it is thus presumed true.
  'repoWrite',
  'templateWrite',
  'templateRead',
}

export interface AppContextInterface {
  rbac?: Record<keyof typeof RbacPermissions, boolean>;
  features: Features | null;
  isFetchingPermissions: boolean;
  subscriptions?: Subscriptions;
  contentOrigin: ContentOrigin[];
  setContentOrigin: React.Dispatch<React.SetStateAction<ContentOrigin[]>>;
  chrome?: ChromeAPI;
  zeroState: boolean;
  setZeroState: (zeroState: boolean) => void;
  isLightspeedEnabled: boolean;
}

export const AppContext = createContext({} as AppContextInterface);

export const ContextProvider = ({ children }: { children: ReactNode }) => {
  const [zeroState, setZeroState] = useState(true);
  const [features, setFeatures] = useState<Features | null>(null);
  const [contentOrigin, setContentOrigin] = useState<ContentOrigin[]>([
    ContentOrigin.EXTERNAL,
    ContentOrigin.UPLOAD,
  ]);

  const chrome = useChrome();
  const { fetchFeatures, isLoading: isFetchingFeatures } = useFetchFeaturesQuery();
  const { data: subscriptions, isLoading: isFetchingSubscriptions } = useFetchSubscriptionsQuery();
  const isLightspeedEnabled = useFlag('platform.lightspeed-rebrand') || false;

  // Determine which permission system to use
  const useKessel = !!(features?.kessel?.enabled && features.kessel?.accessible);

  // Fetch workspace and permissions based on the enabled system
  const { workspaceId, loading: workspaceLoading } = useKesselWorkspace(useKessel);
  const kesselPermissions = useKesselRbac(workspaceId, workspaceLoading);
  const traditionalPermissions = useTraditionalRbac(chrome, features, !useKessel);

  // Select the appropriate RBAC and loading state
  const rbac = useKessel ? kesselPermissions.rbac : traditionalPermissions.rbac;
  const rbacLoading = useKessel ? kesselPermissions.loading : traditionalPermissions.loading;

  // Fetch features on mount and update content origin
  useEffect(() => {
    (async () => {
      const fetchedFeatures = await fetchFeatures();
      setFeatures(fetchedFeatures);

      if (fetchedFeatures?.communityrepos?.enabled) {
        setContentOrigin((prev) =>
          prev.includes(ContentOrigin.COMMUNITY) ? prev : [...prev, ContentOrigin.COMMUNITY],
        );
      } else {
        setContentOrigin((prev) => prev.filter((origin) => origin !== ContentOrigin.COMMUNITY));
      }
    })();
  }, []);

  return (
    <AppContext.Provider
      value={{
        rbac,
        features,
        isFetchingPermissions: isFetchingFeatures || isFetchingSubscriptions || rbacLoading,
        subscriptions,
        contentOrigin,
        setContentOrigin,
        chrome: chrome as ChromeAPI,
        zeroState,
        setZeroState,
        isLightspeedEnabled,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
