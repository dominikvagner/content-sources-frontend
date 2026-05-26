import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import useRootPath from 'Hooks/useRootPath';
import useSafeUUIDParam from 'Hooks/useSafeUUIDParam';

import { useAppContext } from 'middleware/AppContext';
import { DestinationKey, navigationPaths } from './navigationPaths';

/**
 * Relocates to a destination based on the DestinationKey type.
 *
 * To add a new destination, look inside navigationPaths.ts file/
 * @param destinationKey - define the destination to be relocated to (eg. 'repositories')
 * @returns () => void
 */
export const useNavigateTo = (destinationKey: DestinationKey) => {
  const { contentOrigin } = useAppContext();
  const navigate = useNavigate();
  const rootPath = useRootPath();
  const repoUUID = useSafeUUIDParam('repoUUID');

  return useCallback(() => {
    const path = navigationPaths[destinationKey];
    return navigate(path({ rootPath, repoUUID, contentOrigin }));
  }, [contentOrigin, rootPath, repoUUID]);
};
