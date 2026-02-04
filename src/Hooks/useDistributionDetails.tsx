import { useCallback, useMemo } from 'react';
import { useRepositoryParams } from 'services/Content/ContentQueries';
import {
  EXTENDED_SUPPORT_FEATURES,
  extendedReleaseToFeatureName,
} from '../Pages/Templates/TemplatesTable/components/templateHelpers';

export default function useDistributionDetails() {
  const {
    isLoading,
    error,
    isError,
    data: {
      distribution_versions: distVersions = [],
      distribution_arches: distArches = [],
      distribution_minor_versions: distMinorVersions = [],
      extended_release_features: extendedReleaseFeatures = [],
    } = {},
  } = useRepositoryParams();

  const labelToName: Record<string, string> = useMemo(() => {
    const result = {};
    distArches.forEach(({ name, label }) => {
      result[label] = name;
    });
    distVersions.forEach(({ name, label }) => {
      result[label] = name;
    });
    return result;
  }, [distVersions, distArches]);

  /** Converts an arch label (e.g., "x86_64") to its display name. */
  const getArchName = useCallback((arch: string = '') => labelToName[arch] || arch, [labelToName]);

  /** Converts an OS version label (e.g., "9") or array of labels to a display string (e.g., "el9" or "el8, el9"). */
  const getVersionName = useCallback(
    (version?: string | string[]): string => {
      if (!version) return '';
      const versions = Array.isArray(version) ? version : [version];
      const displayNames = versions
        .map((label) => {
          if (!Object.keys(labelToName).includes(label)) return undefined;
          return labelToName[label];
        })
        .filter(Boolean);
      return displayNames.join(', ');
    },
    [labelToName],
  );

  /** Converts a minor version label (e.g., "9.4") to its display name (e.g., "el9.4"). */
  const getMinorVersionName = useCallback(
    (minorVersion?: string) => {
      const name = distMinorVersions?.find(
        (distribution) => distribution.label === minorVersion,
      )?.name;
      return name ?? '';
    },
    [distMinorVersions],
  );

  const getStreamName = useCallback(
    (extendedRelease?: string) => {
      const featureName = extendedReleaseToFeatureName(extendedRelease);
      return extendedReleaseFeatures.find(({ label }) => label === featureName)?.name ?? '';
    },
    [extendedReleaseFeatures],
  );

  const getStreamAvailability = useCallback(
    (majorVersion: string) => {
      const relevantMinors = distMinorVersions.filter(({ major }) => major === majorVersion);
      return EXTENDED_SUPPORT_FEATURES.map((feature) =>
        relevantMinors.some(({ feature_names }) => feature_names?.includes(feature)),
      ) as [boolean, boolean];
    },
    [distMinorVersions],
  );

  const isExtendedSupportAvailable = !!extendedReleaseFeatures?.length;

  return {
    isLoading,
    error,
    isError,
    getArchName,
    getVersionName,
    getStreamName,
    getMinorVersionName,
    getStreamAvailability,
    isExtendedSupportAvailable,
  };
}
