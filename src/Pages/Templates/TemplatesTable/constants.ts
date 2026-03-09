import { NameLabel } from '../../../services/Content/ContentApi';

export const EUS = 'RHEL-EUS-x86_64' as const;
export const E4S = 'RHEL-E4S-x86_64' as const;
export const EXTENDED_SUPPORT_FEATURES = [EUS, E4S] as const;

export const SUPPORTED_MAJOR_VERSIONS = ['8', '9', '10'];
export const SUPPORTED_ARCHES = ['x86_64', 'aarch64'];
export const SUPPORTED_EUS_ARCHES = ['x86_64'];

export const STANDARD_STREAM: NameLabel = { label: '', name: 'Standard' };
export const STANDARD_STREAM_PATH = 'dist';

// Empty string means the release version is unset, i.e., a major release
export const MAJOR_RELEASE_VERSIONS = ['', '8', '8.0', '9', '9.0', '10', '10.0'];

export const TEMPLATE_SYSTEMS_UPDATE_LIMIT = 1000;
