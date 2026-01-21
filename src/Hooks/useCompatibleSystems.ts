import { useQueryClient } from '@tanstack/react-query';
import { useSystemsListQuery } from '../services/Systems/SystemsQueries';
import { TemplateItem } from '../services/Templates/TemplateApi';
import { FETCH_TEMPLATE_KEY } from '../services/Templates/TemplateQueries';

/**
 * Checks if any Insights-registered systems are compatible with a given template's configuration.
 * Retrieves the template from the React Query cache, then queries for systems that match those specifications.
 */
const useCompatibleSystems = (uuid: string) => {
  const queryClient = useQueryClient();

  // Access the cached template data from the parent component (TemplateDetails)
  const template = queryClient.getQueryData<TemplateItem>([FETCH_TEMPLATE_KEY, uuid]);

  const { arch, version } = template || {};

  const queryParams = {
    ...{ os: version, arch: arch },
  };

  const {
    isFetching,
    isError,
    data = { data: [], meta: { total_items: 0, limit: 20, offset: 0 } },
    // Filter by the version and arch of the given template (and minor if it is an extended support template)
    // Use default values for other parameters as they're not relevant for this hook
  } = useSystemsListQuery(1, 20, '', queryParams);

  const hasCompatibleSystems = data.meta.total_items > 0;

  return {
    hasCompatibleSystems,
    isFetchingCompatibility: isFetching,
    isCompatibilityError: isError,
  };
};

export default useCompatibleSystems;
