import { render } from '@testing-library/react';
import { useAddOrEditTemplateContext } from '../AddOrEditTemplateContext';
import {
  defaultTemplateItem,
  testRepositoryParamsResponse,
  ReactQueryTestWrapper,
} from 'testingHelpers';
import OSAndArchitectureStep from './OSAndArchitectureStep';
import useDistributionDetails from '../../../../../../Hooks/useDistributionDetails';

jest.mock('../AddOrEditTemplateContext', () => ({
  useAddOrEditTemplateContext: jest.fn(),
}));

jest.mock('../../../../../../Hooks/useDistributionDetails', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const versionName = `el${defaultTemplateItem.version}`;

beforeEach(() => {
  (useDistributionDetails as jest.Mock).mockImplementation(() => ({
    getVersionName: () => versionName,
    getArchName: () => defaultTemplateItem.arch,
    isExtendedSupportAvailable: false,
  }));
});

it('expect OSAndArchitectureStep to render correctly', () => {
  (useAddOrEditTemplateContext as jest.Mock).mockImplementation(() => ({
    isEdit: false,
    templateRequest: defaultTemplateItem,
    setTemplateRequest: () => undefined,
    distribution_arches: testRepositoryParamsResponse.distribution_arches,
    distribution_versions: testRepositoryParamsResponse.distribution_versions,
    extended_release_features: testRepositoryParamsResponse.extended_release_features,
    distribution_minor_versions: testRepositoryParamsResponse.distribution_minor_versions,
  }));

  const { getByText } = render(
    <ReactQueryTestWrapper>
      <OSAndArchitectureStep />
    </ReactQueryTestWrapper>,
  );

  const archMenuToggle = getByText(defaultTemplateItem.arch);
  expect(archMenuToggle).toBeInTheDocument();
  expect(archMenuToggle).not.toHaveAttribute('disabled');

  const versionMenuToggle = getByText(versionName);
  expect(versionMenuToggle).toBeInTheDocument();
  expect(versionMenuToggle).not.toHaveAttribute('disabled');
});

it('expect OSAndArchitectureStep to render with disabled inputs', () => {
  (useAddOrEditTemplateContext as jest.Mock).mockImplementation(() => ({
    isEdit: true,
    templateRequest: defaultTemplateItem,
    setTemplateRequest: () => undefined,
    distribution_arches: testRepositoryParamsResponse.distribution_arches,
    distribution_versions: testRepositoryParamsResponse.distribution_versions,
    extended_release_features: testRepositoryParamsResponse.extended_release_features,
    distribution_minor_versions: testRepositoryParamsResponse.distribution_minor_versions,
  }));

  const { getByTestId } = render(
    <ReactQueryTestWrapper>
      <OSAndArchitectureStep />
    </ReactQueryTestWrapper>,
  );

  const archMenuToggle = getByTestId('restrict_to_architecture');
  expect(archMenuToggle).toBeInTheDocument();
  expect(archMenuToggle).toHaveAttribute('disabled');

  const versionMenuToggle = getByTestId('restrict_to_os_version');
  expect(versionMenuToggle).toBeInTheDocument();
  expect(versionMenuToggle).toHaveAttribute('disabled');
});
