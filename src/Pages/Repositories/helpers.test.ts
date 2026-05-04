import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { hasOrigin, lastIntrospectionDisplay, versionNameToApiValue } from './helpers';

dayjs.extend(relativeTime);

describe('hasOrigin', () => {
  it('should return true if the value has an origin property', () => {
    expect(hasOrigin({ origin: 'Red Hat' })).toBe(true);
  });

  it("should return false if the value doesn't have an origin property", () => {
    expect(hasOrigin({})).toBe(false);
  });

  it('should return false for null and non-object values', () => {
    expect(hasOrigin(null)).toBe(false);
    expect(hasOrigin(undefined)).toBe(false);
    expect(hasOrigin('string')).toBe(false);
  });
});

describe('lastIntrospectionDisplay', () => {
  it('should return "Never" for an empty string', () => {
    expect(lastIntrospectionDisplay('')).toBe('Never');
  });

  it('should return "Never" for undefined', () => {
    expect(lastIntrospectionDisplay(undefined)).toBe('Never');
  });

  it('should return a relative time string for a valid timestamp', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(lastIntrospectionDisplay(fiveMinutesAgo)).toBe('5 minutes ago');
  });
});

describe('versionNameToApiValue', () => {
  it('should return the version number if the version name contains a space', () => {
    // The backend always returns the version name in this format: `RHEL X`
    expect(versionNameToApiValue('RHEL 8.5')).toBe('8.5');
  });

  it('should return an empty string if the version name does not satisfy the expected format', () => {
    expect(versionNameToApiValue('RHEL')).toBe('');
  });
});
