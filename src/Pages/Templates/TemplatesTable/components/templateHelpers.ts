import * as Yup from 'yup';
import { NameLabel } from 'services/Content/ContentApi';

export const EUS = 'RHEL-EUS-x86_64' as const;
export const E4S = 'RHEL-E4S-x86_64' as const;
export const EXTENDED_SUPPORT_FEATURES = [EUS, E4S] as const;
export const SUPPORTED_EUS_ARCHES = ['x86_64'];

type ExtendedRelease = 'eus' | 'e4s' | 'none'; // Values supported by the API

/**
 * Converts a feature name to an extended release name.
 * @param featureName
 */
export const featureNameToExtendedRelease = (featureName: string | undefined): ExtendedRelease =>
  featureName === EUS ? 'eus' : featureName === E4S ? 'e4s' : 'none';

/**
 * Checks if the user has extended support features enabled.
 * @param extended_release_features
 */
export const hasExtendedSupport = (extended_release_features?: NameLabel[]) =>
  (extended_release_features?.length ?? 0) > 0;

export const hardcodeRedHatReposByArchAndVersion = (
  arch?: string,
  version?: string,
): string[] | undefined => {
  if (!arch || !version) return;
  switch (true) {
    case arch === 'x86_64' && version === '8':
      return [
        'https://cdn.redhat.com/content/dist/rhel8/8/x86_64/appstream/os',
        'https://cdn.redhat.com/content/dist/rhel8/8/x86_64/baseos/os',
      ];
    case arch === 'x86_64' && version === '9':
      return [
        'https://cdn.redhat.com/content/dist/rhel9/9/x86_64/appstream/os',
        'https://cdn.redhat.com/content/dist/rhel9/9/x86_64/baseos/os',
      ];
    case arch === 'x86_64' && version === '10':
      return [
        'https://cdn.redhat.com/content/dist/rhel10/10/x86_64/appstream/os',
        'https://cdn.redhat.com/content/dist/rhel10/10/x86_64/baseos/os',
      ];
    case arch === 'aarch64' && version === '8':
      return [
        'https://cdn.redhat.com/content/dist/rhel8/8/aarch64/appstream/os',
        'https://cdn.redhat.com/content/dist/rhel8/8/aarch64/baseos/os',
      ];
    case arch === 'aarch64' && version === '9':
      return [
        'https://cdn.redhat.com/content/dist/rhel9/9/aarch64/appstream/os',
        'https://cdn.redhat.com/content/dist/rhel9/9/aarch64/baseos/os',
      ];
    case arch === 'aarch64' && version === '10':
      return [
        'https://cdn.redhat.com/content/dist/rhel10/10/aarch64/appstream/os',
        'https://cdn.redhat.com/content/dist/rhel10/10/aarch64/baseos/os',
      ];

    default:
      return;
  }
};

export const TemplateValidationSchema = Yup.object().shape({
  name: Yup.string().max(255, 'Too Long!').required('Required'),
  description: Yup.string().max(255, 'Too Long!'),
});

export const isMinorRelease = (rhsm: string) =>
  // Empty string means that the RHEL release version is unset and should be treated as a major release
  !['', '8', '8.0', '9', '9.0', '10', '10.0'].includes(rhsm);

export const TEMPLATE_SYSTEMS_UPDATE_LIMIT = 1000;
