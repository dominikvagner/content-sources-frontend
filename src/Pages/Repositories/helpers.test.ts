import { hasOrigin, versionNameToApiValue } from './helpers';

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

describe('versionNameToApiValue', () => {
  it('should return the version number if the version name contains a space', () => {
    // The backend always returns the version name in this format: `RHEL X`
    expect(versionNameToApiValue('RHEL 8.5')).toBe('8.5');
  });

  it('should return an empty string if the version name does not satisfy the expected format', () => {
    expect(versionNameToApiValue('RHEL')).toBe('');
  });
});
