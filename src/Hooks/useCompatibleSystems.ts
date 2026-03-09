import { useQueryClient } from 'react-query';
import { useRepositoryParams } from '../services/Content/ContentQueries';
import { useSystemsListQuery } from '../services/Systems/SystemsQueries';
import { TemplateItem } from '../services/Templates/TemplateApi';
import { FETCH_TEMPLATE_KEY } from '../services/Templates/TemplateQueries';
import {
  extendedReleaseToFeatureName,
  isExtendedSupportTemplate,
} from '../Pages/Templates/TemplatesTable/helpers';

/**
 * Checks if any Insights-registered systems are compatible with a given template's configuration.
 * Retrieves the template from the React Query cache, then queries for systems that match those specifications.
 */
const useCompatibleSystems = (uuid: string) => {
  const queryClient = useQueryClient();

  // Access the cached template data from the parent component (TemplateDetails)
  const template = queryClient.getQueryData<TemplateItem>([FETCH_TEMPLATE_KEY, uuid]);

  const { arch, version, extended_release, extended_release_version } = template || {};

  const templateUsesExtendedSupport = isExtendedSupportTemplate(
    extended_release,
    extended_release_version,
  );

  const queryParams = {
    ...{ os: version, arch: arch },
    ...(templateUsesExtendedSupport ? { osminor: extended_release_version } : {}),
  };

  const {
    isFetching,
    isError,
    data = { data: [], meta: { total_items: 0, limit: 20, offset: 0 } },
    // Filter by the version and arch of the given template (and minor if it is an extended support template)
    // Use default values for other parameters as they're not relevant for this hook
  } = useSystemsListQuery(1, 20, '', queryParams);

  const { data: { distribution_minor_versions = [] } = {} } = useRepositoryParams();

  let hasCompatibleSystems = data.meta.total_items > 0;

  // For extended support templates, verify the template's stream is available for the minor version of at least one returned system
  if (templateUsesExtendedSupport && hasCompatibleSystems) {
    const featureName = extendedReleaseToFeatureName(extended_release);
    hasCompatibleSystems = data.data.some((system) => {
      const minorEntry = distribution_minor_versions.find(
        (minorVersion) => minorVersion.label === system.attributes.rhsm,
      );
      return minorEntry?.feature_names?.includes(featureName) ?? false;
    });
  }

  return {
    hasCompatibleSystems,
    isFetchingCompatibility: isFetching,
    isCompatibilityError: isError,
  };
};

export default useCompatibleSystems;
