import { ContentOrigin } from 'services/Content/ContentApi';
import { useFetchContent } from 'services/Content/ContentQueries';

export const useEnableDelete = (repoUUID) => {
  const { data: repository, isError } = useFetchContent(repoUUID);
  const isUploadRepository = repository?.origin === ContentOrigin.UPLOAD;
  return [isUploadRepository, isError];
};
