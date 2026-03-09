import * as Yup from 'yup';
import {
  EUS,
  E4S,
  SUPPORTED_ARCHES,
  SUPPORTED_MAJOR_VERSIONS,
  SUPPORTED_EUS_ARCHES,
  STANDARD_STREAM_PATH,
  MAJOR_RELEASE_VERSIONS,
} from './constants';

/** Converts a feature name label (e.g., 'RHEL-EUS-x86_64') to the API format ('eus'/'e4s'/''). */
export const featureNameToExtendedRelease = (featureName: string | undefined) =>
  featureName === EUS ? 'eus' : featureName === E4S ? 'e4s' : (featureName ?? '');

/** Converts an API format value ('eus'/'e4s') back to the feature name label used by repository_parameters. */
export const extendedReleaseToFeatureName = (release: string | undefined) =>
  release === 'eus' ? EUS : release === 'e4s' ? E4S : '';

export const calculateMajorVersion = (minorVersion: string) => minorVersion.split('.')[0];

const validateRedHatRepoParams = (
  arch?: string,
  majorVersion?: string,
  featureName?: string,
  minorVersion?: string,
): boolean => {
  if (!arch || !majorVersion) return false;
  if (!SUPPORTED_ARCHES.includes(arch)) return false;
  if (!SUPPORTED_MAJOR_VERSIONS.includes(majorVersion)) return false;

  // Standard stream: only arch and major version are needed
  if (!featureName) return true;

  // Extended stream (EUS/E4S): all four params are required
  if (!minorVersion) return false;
  if (!SUPPORTED_EUS_ARCHES.includes(arch)) return false;

  return ['eus', 'e4s'].includes(featureName);
};

export const getRedHatCoreRepoUrls = (
  arch?: string,
  majorVersion?: string,
  releaseStream?: string,
  minorVersion?: string,
): string[] => {
  const areParamsValid = validateRedHatRepoParams(arch, majorVersion, releaseStream, minorVersion);
  if (!areParamsValid) return [];

  const stream = releaseStream || STANDARD_STREAM_PATH;
  const versionNumber = stream === STANDARD_STREAM_PATH ? majorVersion : minorVersion;

  return [
    `https://cdn.redhat.com/content/${stream}/rhel${majorVersion}/${versionNumber}/${arch}/appstream/os/`,
    `https://cdn.redhat.com/content/${stream}/rhel${majorVersion}/${versionNumber}/${arch}/baseos/os/`,
  ];
};

export const isMinorRelease = (distributionVersion: string) =>
  !MAJOR_RELEASE_VERSIONS.includes(distributionVersion);

/** Checks if a template uses extended support (EUS or E4S) based on its configuration. */
export const isExtendedSupportTemplate = (
  extended_release?: string,
  extended_release_version?: string,
) => !!(extended_release && extended_release_version);

export const canAssignSystemToTemplate = (
  version: string,
  satelliteManaged: boolean,
  notAlreadyAssigned: boolean,
  templateUsesExtendedSupport: boolean,
) =>
  notAlreadyAssigned &&
  !satelliteManaged &&
  // Standard templates: cannot be assigned to systems on minor release versions
  // Extended support templates: can be assigned to systems on both minor and major versions (HMS-10156)
  (templateUsesExtendedSupport || !isMinorRelease(version));

/** Extracts the abbreviation from parentheses, e.g., "Extended Update Support (EUS)" to "EUS". */
export const abbreviateStreamName = (streamName: string) =>
  streamName.match(/\(([^)]+)\)/)?.[1] ?? '';

export const isMinorVersionOfMajor = (minorVersion?: string, majorVersion?: string) => {
  if (minorVersion && majorVersion) {
    return minorVersion.split('.')[0] === majorVersion;
  }
  return false;
};

export const TemplateValidationSchema = Yup.object().shape({
  name: Yup.string().max(255, 'Too Long!').required('Required'),
  description: Yup.string().max(255, 'Too Long!'),
});
