import { render } from '@testing-library/react';
import { useAddOrEditTemplateContext } from '../AddOrEditTemplateContext';
import {
  defaultTemplateItem,
  testRepositoryParamsResponse,
  ReactQueryTestWrapper,
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

it('expect Review step to render correctly', () => {
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
