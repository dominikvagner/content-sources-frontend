import { useAddOrEditTemplateContext } from '../Pages/Templates/TemplatesTable/components/AddOrEditTemplate/AddOrEditTemplateContext';
import { EXTENDED_SUPPORT_FEATURES } from '../Pages/Templates/TemplatesTable/components/templateHelpers';

export const useCheckStreamAvailability = (): boolean[] => {
  const { templateRequest, distribution_minor_versions } = useAddOrEditTemplateContext();

  const relevantMinors = distribution_minor_versions.filter(
    ({ major }) => major === templateRequest.version,
  );

  return EXTENDED_SUPPORT_FEATURES.map((featureLabel) =>
    relevantMinors.some(({ feature_names }) => feature_names?.includes(featureLabel)),
  );
};
