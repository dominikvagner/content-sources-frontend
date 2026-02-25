import { render } from '@testing-library/react';
import { useAddOrEditTemplateContext } from '../AddOrEditTemplateContext';
import {
  defaultTemplateItem,
  testRepositoryParamsResponse,
  testEUSRepositoryParamsResponse,
  ReactQueryTestWrapper,
  defaultEUSupportTemplateItem,
} from 'testingHelpers';
import ReviewStep from './ReviewStep';
import { formatDateDDMMMYYYY } from 'helpers';
import useDistributionDetails from '../../../../../../Hooks/useDistributionDetails';

jest.mock('../AddOrEditTemplateContext', () => ({
  useAddOrEditTemplateContext: jest.fn(),
}));

jest.mock('../../../../../../Hooks/useDistributionDetails', () => ({
  __esModule: true,
  default: jest.fn(),
}));

it('renders template details for a standard template', () => {
  (useAddOrEditTemplateContext as jest.Mock).mockImplementation(() => ({
    templateRequest: defaultTemplateItem,
    selectedRedHatRepos: new Set(['item1', 'item2']),
    selectedCustomRepos: new Set(['item1']),
    redHatCoreRepos: new Set('item1'),
    distribution_arches: testRepositoryParamsResponse.distribution_arches,
    distribution_versions: testRepositoryParamsResponse.distribution_versions,
    extended_release_features: testRepositoryParamsResponse.extended_release_features,
    distribution_minor_versions: testRepositoryParamsResponse.distribution_minor_versions,
    isEdit: false,
  }));

  const versionName = `el${defaultTemplateItem.version}`;

  (useDistributionDetails as jest.Mock).mockImplementation(() => ({
    getVersionName: () => versionName,
    getArchName: () => defaultTemplateItem.arch,
    isExtendedSupportAvailable: false,
  }));

  const { getByText } = render(
    <ReactQueryTestWrapper>
      <ReviewStep />
    </ReactQueryTestWrapper>,
  );

  expect(getByText('Create')).toBeInTheDocument();
  expect(getByText(defaultTemplateItem.arch)).toBeInTheDocument();
  expect(getByText(versionName)).toBeInTheDocument();
  expect(getByText(formatDateDDMMMYYYY(defaultTemplateItem.date))).toBeInTheDocument();
  expect(getByText(defaultTemplateItem.name)).toBeInTheDocument();
});

it('renders release stream and minor version for an EUS template', () => {
  (useAddOrEditTemplateContext as jest.Mock).mockImplementation(() => ({
    templateRequest: defaultEUSupportTemplateItem,
    selectedRedHatRepos: new Set(['rhel-9-for-x86_64-baseos-eus-rpms']),
    selectedCustomRepos: new Set(['epel-9-x86_64']),
    redHatCoreRepos: new Set('rhel-9-for-x86_64-baseos-eus-rpms'),
    distribution_arches: testEUSRepositoryParamsResponse.distribution_arches,
    distribution_versions: testEUSRepositoryParamsResponse.distribution_versions,
    extended_release_features: testEUSRepositoryParamsResponse.extended_release_features,
    distribution_minor_versions: testEUSRepositoryParamsResponse.distribution_minor_versions,
    isEdit: false,
  }));

  const versionName = `el${defaultEUSupportTemplateItem.extended_release_version}`;
  const streamName = 'Extended Update Support (EUS)';

  (useDistributionDetails as jest.Mock).mockImplementation(() => ({
    getMinorVersionName: () => versionName,
    getArchName: () => defaultEUSupportTemplateItem.arch,
    getStreamName: () => streamName,
    isExtendedSupportAvailable: true,
  }));

  const { getByText } = render(
    <ReactQueryTestWrapper>
      <ReviewStep />
    </ReactQueryTestWrapper>,
  );

  expect(getByText('Release stream')).toBeInTheDocument();
  expect(getByText(streamName)).toBeInTheDocument();
  expect(getByText(versionName)).toBeInTheDocument();
});
