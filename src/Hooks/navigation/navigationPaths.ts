import { ContentOrigin } from 'services/Content/ContentApi';

import { PACKAGES_ROUTE, REPOSITORIES_ROUTE } from 'Routes/constants';

export type DestinationKey = 'repositories' | 'packagesLatest' | 'root';

type NavigationPaths = Record<DestinationKey, BuildDestinationPath>;
type BuildDestinationPath = (params: DestinationParams) => string;
type DestinationParams = {
  contentOrigin: ContentOrigin[];
  rootPath: string;
  repoUUID: string;
};

/**
 * Record that builds appropriate location string based on runtime parameters.
 *
 * To create a new destination, put (1) a new key into DestinationKey type.
 * (2) for this key define a new function that builds the final destination string.
 * You can use already defined DestinaionParams or define in the type new ones
 * if something is missing. In that case you also need to make appropriate
 * changes in the useNavigationTo hook.
 */
export const navigationPaths: NavigationPaths = {
  root: ({ rootPath, contentOrigin }) =>
    rootPath +
    (contentOrigin.length === 1 && contentOrigin[0] === ContentOrigin.REDHAT
      ? `?origin=${contentOrigin}`
      : ''),
  packagesLatest: ({ rootPath, repoUUID }) =>
    `${rootPath}/${REPOSITORIES_ROUTE}/${repoUUID}/${PACKAGES_ROUTE}`,
  repositories: ({ rootPath, contentOrigin }) =>
    `${rootPath}/${REPOSITORIES_ROUTE}` +
    (contentOrigin.length === 1 && contentOrigin[0] === ContentOrigin.REDHAT
      ? `?origin=${contentOrigin}`
      : ''),
};
