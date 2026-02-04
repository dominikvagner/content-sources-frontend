import * as Yup from 'yup';
import { NameLabel } from 'services/Content/ContentApi';

export const EUS = 'RHEL-EUS-x86_64' as const;
export const E4S = 'RHEL-E4S-x86_64' as const;
export const EXTENDED_SUPPORT_FEATURES = [EUS, E4S] as const;
export const SUPPORTED_EUS_ARCHES = ['x86_64'];

export const SUPPORTED_MAJOR_VERSIONS = ['8', '9', '10'];
export const SUPPORTED_ARCHES = ['x86_64', 'aarch64'];

export const STANDARD_STREAM: NameLabel = { label: '', name: 'Standard' };
const STANDARD_STREAM_PATH = 'dist';
const MAJOR_RELEASE_VERSIONS = ['', '8', '8.0', '9', '9.0', '10', '10.0'];

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
): string[] | undefined => {
  const areParamsValid = validateRedHatRepoParams(arch, majorVersion, releaseStream, minorVersion);
  if (!areParamsValid) return;

  const stream = releaseStream || STANDARD_STREAM_PATH;
  const versionNumber = stream === STANDARD_STREAM_PATH ? majorVersion : minorVersion;

  return [
    `https://cdn.redhat.com/content/${stream}/rhel${majorVersion}/${versionNumber}/${arch}/appstream/os/`,
    `https://cdn.redhat.com/content/${stream}/rhel${majorVersion}/${versionNumber}/${arch}/baseos/os/`,
  ];
};

export const isMinorRelease = (distributionVersion: string) =>
  !MAJOR_RELEASE_VERSIONS.includes(distributionVersion);

export const TemplateValidationSchema = Yup.object().shape({
  name: Yup.string().max(255, 'Too Long!').required('Required'),
  description: Yup.string().max(255, 'Too Long!'),
});

export const TEMPLATE_SYSTEMS_UPDATE_LIMIT = 1000;
