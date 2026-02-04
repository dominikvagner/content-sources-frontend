import { getRedHatCoreRepoUrls } from './templateHelpers';

describe('getRedHatCoreRepoUrls', () => {
  it('returns standard stream URLs when no release stream is specified', () => {
    let result = getRedHatCoreRepoUrls('x86_64', '8') as string[];
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual('https://cdn.redhat.com/content/dist/rhel8/8/x86_64/appstream/os/');

    result = getRedHatCoreRepoUrls('aarch64', '9') as string[];
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual('https://cdn.redhat.com/content/dist/rhel9/9/aarch64/appstream/os/');
  });

  it('returns standard stream URLs for empty release stream', () => {
    // Both params are '' for standard stream, never undefined as they come from templateRequest
    const result = getRedHatCoreRepoUrls('x86_64', '9', '', '') as string[];
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual('https://cdn.redhat.com/content/dist/rhel9/9/x86_64/appstream/os/');
  });

  it('returns EUS stream URLs with minor version', () => {
    const result = getRedHatCoreRepoUrls('x86_64', '9', 'eus', '9.4') as string[];
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual('https://cdn.redhat.com/content/eus/rhel9/9.4/x86_64/appstream/os/');
    expect(result[1]).toEqual('https://cdn.redhat.com/content/eus/rhel9/9.4/x86_64/baseos/os/');
  });

  it('returns E4S stream URLs with minor version', () => {
    const result = getRedHatCoreRepoUrls('x86_64', '8', 'e4s', '8.6') as string[];
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual('https://cdn.redhat.com/content/e4s/rhel8/8.6/x86_64/appstream/os/');
  });

  it('returns undefined for unsupported arch/version', () => {
    expect(getRedHatCoreRepoUrls('stuff', '12')).toBeUndefined();
  });

  it('returns undefined for EUS with non-x86_64 arch', () => {
    expect(getRedHatCoreRepoUrls('aarch64', '9', 'eus', '9.4')).toBeUndefined();
  });
});
