import { LifecycleItem, RoadmapLifecycleResponse } from 'services/Roadmap/RoadmapApi';
import {
  describeOSVersionDropdownItem,
  getRedHatCoreRepoUrls,
  isMinorVersionOfMajor,
  extractMinorVersion,
  isArchManuallyDisabled,
} from './helpers';

describe('getRedHatCoreRepoUrls', () => {
  it('returns standard stream URLs when no release stream is specified', () => {
    let result = getRedHatCoreRepoUrls('x86_64', '8');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual('https://cdn.redhat.com/content/dist/rhel8/8/x86_64/appstream/os/');
    expect(result[1]).toEqual('https://cdn.redhat.com/content/dist/rhel8/8/x86_64/baseos/os/');

    result = getRedHatCoreRepoUrls('aarch64', '9');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual('https://cdn.redhat.com/content/dist/rhel9/9/aarch64/appstream/os/');
    expect(result[1]).toEqual('https://cdn.redhat.com/content/dist/rhel9/9/aarch64/baseos/os/');
  });

  it('returns standard stream URLs for empty release stream', () => {
    // Both params are '' for standard stream, never undefined as they come from templateRequest
    const result = getRedHatCoreRepoUrls('x86_64', '9', '', '');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual('https://cdn.redhat.com/content/dist/rhel9/9/x86_64/appstream/os/');
    expect(result[1]).toEqual('https://cdn.redhat.com/content/dist/rhel9/9/x86_64/baseos/os/');
  });

  it('returns EUS stream URLs with minor version', () => {
    const result = getRedHatCoreRepoUrls('x86_64', '9', 'eus', '9.4');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual('https://cdn.redhat.com/content/eus/rhel9/9.4/x86_64/appstream/os/');
    expect(result[1]).toEqual('https://cdn.redhat.com/content/eus/rhel9/9.4/x86_64/baseos/os/');
  });

  it('returns E4S stream URLs with minor version', () => {
    const result = getRedHatCoreRepoUrls('x86_64', '8', 'e4s', '8.6');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual('https://cdn.redhat.com/content/e4s/rhel8/8.6/x86_64/appstream/os/');
    expect(result[1]).toEqual('https://cdn.redhat.com/content/e4s/rhel8/8.6/x86_64/baseos/os/');
  });

  it('returns EEUS stream URLs with minor version (mapped to e4s path)', () => {
    const result = getRedHatCoreRepoUrls('x86_64', '8', 'eeus', '8.10');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual('https://cdn.redhat.com/content/e4s/rhel8/8.10/x86_64/appstream/os/');
    expect(result[1]).toEqual('https://cdn.redhat.com/content/e4s/rhel8/8.10/x86_64/baseos/os/');
  });

  it('returns empty array when arch or major version are missing', () => {
    expect(getRedHatCoreRepoUrls(undefined, undefined)).toEqual([]);
    expect(getRedHatCoreRepoUrls('', '')).toEqual([]);
    expect(getRedHatCoreRepoUrls('x86_64', undefined)).toEqual([]);
    expect(getRedHatCoreRepoUrls(undefined, '9')).toEqual([]);
  });

  it('returns empty array for extended support when minor version is missing', () => {
    expect(getRedHatCoreRepoUrls('x86_64', '9', 'eus', undefined)).toEqual([]);
    expect(getRedHatCoreRepoUrls('x86_64', '9', 'eus', '')).toEqual([]);
    expect(getRedHatCoreRepoUrls('x86_64', '9', 'e4s', undefined)).toEqual([]);
    expect(getRedHatCoreRepoUrls('x86_64', '9', 'eeus', undefined)).toEqual([]);
  });
});

describe('isMinorVersionOfMajor', () => {
  it('returns true when minor version matches major version', () => {
    expect(isMinorVersionOfMajor('9.4', '9')).toBe(true);
  });

  it('returns false when minor version does not match major version', () => {
    expect(isMinorVersionOfMajor('9.4', '8')).toBe(false);
  });

  it('returns false when minor version is empty string', () => {
    expect(isMinorVersionOfMajor('', '9')).toBe(false);
  });
});

describe('extractMinorVersion', () => {
  it('returns only the minor number when given the full version', () => {
    expect(extractMinorVersion('9.4')).toEqual('4');
  });
});

describe('isArchManuallyDisabled', () => {
  it('disables x86_64 for EEUS version 9', () => {
    expect(isArchManuallyDisabled('x86_64', 'eeus', '9')).toBe(true);
  });

  it('does not disable aarch64 for EEUS version 9', () => {
    expect(isArchManuallyDisabled('aarch64', 'eeus', '9')).toBe(false);
  });

  it('does not disable x86_64 for non-EUS version 9', () => {
    expect(isArchManuallyDisabled('x86_64', 'e4s', '9')).toBe(false);
  });
});

describe('describeOSVersionDropdownItem', () => {
  const data9: LifecycleItem = {
    name: 'RHEL 9',
    start_date: '',
    end_date: '2027-04-01',
    major: 9,
  };
  const data9_9: LifecycleItem = {
    name: 'RHEL 9.9',
    start_date: '',
    end_date: '2026-04-01',
    major: 9,
    minor: 9,
  };
  const metadata9: RoadmapLifecycleResponse = { data: [data9, data9_9] };

  it('deos not show description when no response is returned', () => {
    expect(describeOSVersionDropdownItem(undefined, false, 9)).toBe(undefined);
  });
  it('deos not show description when there was a request error', () => {
    expect(describeOSVersionDropdownItem(metadata9, true, 9)).toBe(undefined);
  });

  it('shows correct description when data exists', () => {
    expect(describeOSVersionDropdownItem(metadata9, false, 9)).toBe(
      'Full support ends: April 2026 | Maintenance support ends: April 2027',
    );
  });

  it('shows N/A on partial failure', () => {
    expect(describeOSVersionDropdownItem({ data: [] }, false, 9)).toBe(
      'Full support ends: N/A | Maintenance support ends: N/A',
    );
    expect(describeOSVersionDropdownItem({ data: [data9] }, false, 9)).toBe(
      'Full support ends: N/A | Maintenance support ends: April 2027',
    );
    expect(describeOSVersionDropdownItem({ data: [data9_9] }, false, 9)).toBe(
      'Full support ends: April 2026 | Maintenance support ends: N/A',
    );
    expect(describeOSVersionDropdownItem(metadata9, false, 8)).toBe(
      'Full support ends: N/A | Maintenance support ends: N/A',
    );
  });
});
