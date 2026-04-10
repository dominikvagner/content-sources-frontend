import { ContentOrigin } from '../../services/Content/ContentApi';

export const hasOrigin = (value: unknown): value is { origin?: ContentOrigin } =>
  typeof value === 'object' && value !== null && 'origin' in value;

/**
 * Converts a version name like "RHEL 8.5" to "8.5" for use in the API. Returns an empty string if no version is found.
 */
export const versionNameToApiValue = (versionName: string) => versionName.split(' ')[1] ?? '';
