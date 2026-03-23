import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAddOrEditTemplateContext } from '../AddOrEditTemplateContext';
import {
  defaultTemplateItem,
  testRepositoryParamsResponse,
  ReactQueryTestWrapper,
  defaultEUSupportTemplateItem,
  testEUSRepositoryParamsResponse,
  testRoadmapLifecycleResponse,
} from 'testingHelpers';
import OSAndArchitectureStep from './OSAndArchitectureStep';
import useDistributionDetails from '../../../../../../Hooks/useDistributionDetails';
import { useFetchLifecycle } from 'services/Roadmap/RoadmapQueries';

jest.mock('../AddOrEditTemplateContext', () => ({
  useAddOrEditTemplateContext: jest.fn(),
}));

jest.mock('../../../../../../Hooks/useDistributionDetails', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('services/Roadmap/RoadmapQueries', () => ({
  useFetchLifecycle: jest.fn(),
}));

const standardVersionName = `el${defaultTemplateItem.version}`;

const defaultStandardContext = {
  isEdit: false,
  templateRequest: defaultTemplateItem,
  setTemplateRequest: () => undefined,
  distribution_arches: testRepositoryParamsResponse.distribution_arches,
  distribution_versions: testRepositoryParamsResponse.distribution_versions,
  extended_release_streams: testRepositoryParamsResponse.extended_release_streams,
  distribution_minor_versions: testRepositoryParamsResponse.distribution_minor_versions,
  isExtendedSupportAvailable: false,
};

const eusStreamName = 'Extended Update Support (EUS)';

const defaultEUSContext = {
  isEdit: false,
  templateRequest: defaultEUSupportTemplateItem,
  setTemplateRequest: () => undefined,
  distribution_arches: testEUSRepositoryParamsResponse.distribution_arches,
  distribution_versions: testEUSRepositoryParamsResponse.distribution_versions,
  extended_release_streams: testEUSRepositoryParamsResponse.extended_release_streams,
  distribution_minor_versions: testEUSRepositoryParamsResponse.distribution_minor_versions,
  isExtendedSupportAvailable: true,
};

const defaultEUSDistributionDetails = {
  getMinorVersionName: () => `el${defaultEUSupportTemplateItem.extended_release_version}`,
  getArchName: () => defaultEUSupportTemplateItem.arch,
  getStreamName: () => eusStreamName,
  getVersionName: () => '',
};

beforeEach(() => {
  (useDistributionDetails as jest.Mock).mockImplementation(() => ({
    getVersionName: () => standardVersionName,
    getArchName: () => defaultTemplateItem.arch,
    getMinorVersionName: () => '',
    getStreamName: () => '',
  }));

  (useAddOrEditTemplateContext as jest.Mock).mockImplementation(() => defaultStandardContext);

  (useFetchLifecycle as jest.Mock).mockImplementation(() => ({
    data: testRoadmapLifecycleResponse,
    isError: false,
    isLoading: false,
  }));
});

it('renders enabled arch and version selectors when creating a standard template', () => {
  const { getByText } = render(
    <ReactQueryTestWrapper>
      <OSAndArchitectureStep />
    </ReactQueryTestWrapper>,
  );

  const archMenuToggle = getByText(defaultTemplateItem.arch);
  expect(archMenuToggle).toBeInTheDocument();
  expect(archMenuToggle).toBeEnabled();

  const versionMenuToggle = getByText(standardVersionName);
  expect(versionMenuToggle).toBeInTheDocument();
  expect(versionMenuToggle).toBeEnabled();
});

it('disables arch and version selectors when editing an existing standard template', () => {
  (useAddOrEditTemplateContext as jest.Mock).mockImplementation(() => ({
    ...defaultStandardContext,
    isEdit: true,
  }));

  const { getByTestId } = render(
    <ReactQueryTestWrapper>
      <OSAndArchitectureStep />
    </ReactQueryTestWrapper>,
  );

  const archMenuToggle = getByTestId('restrict_to_architecture');
  expect(archMenuToggle).toBeInTheDocument();
  expect(archMenuToggle).toBeDisabled();

  const versionMenuToggle = getByTestId('restrict_to_os_version');
  expect(versionMenuToggle).toBeInTheDocument();
  expect(versionMenuToggle).toBeDisabled();
});

it('renders release stream and minor version when creating an EUS template', () => {
  (useDistributionDetails as jest.Mock).mockImplementation(() => defaultEUSDistributionDetails);
  (useAddOrEditTemplateContext as jest.Mock).mockImplementation(() => defaultEUSContext);

  const { getByText } = render(
    <ReactQueryTestWrapper>
      <OSAndArchitectureStep />
    </ReactQueryTestWrapper>,
  );

  expect(getByText('Release stream')).toBeInTheDocument();
  expect(getByText(eusStreamName)).toBeInTheDocument();
  expect(
    getByText(`el${defaultEUSupportTemplateItem.extended_release_version}`),
  ).toBeInTheDocument();
  expect(getByText(defaultEUSupportTemplateItem.arch)).toBeInTheDocument();
});

it('keeps the version selector enabled when editing an EUS template', () => {
  (useDistributionDetails as jest.Mock).mockImplementation(() => defaultEUSDistributionDetails);
  (useAddOrEditTemplateContext as jest.Mock).mockImplementation(() => ({
    ...defaultEUSContext,
    isEdit: true,
  }));

  const { getByTestId } = render(
    <ReactQueryTestWrapper>
      <OSAndArchitectureStep />
    </ReactQueryTestWrapper>,
  );

  const versionMenuToggle = getByTestId('restrict_to_os_version');
  expect(versionMenuToggle).toBeInTheDocument();
  expect(versionMenuToggle).toBeEnabled();
});

it('hides release stream selection when no streams are entitled', () => {
  (useDistributionDetails as jest.Mock).mockImplementation(() => ({
    getVersionName: () => standardVersionName,
    getArchName: () => defaultTemplateItem.arch,
    getMinorVersionName: () => '',
    getStreamName: () => '',
  }));

  (useAddOrEditTemplateContext as jest.Mock).mockImplementation(() => ({
    ...defaultStandardContext,
    isExtendedSupportAvailable: false,
    extended_release_streams: [], // No entitled streams
  }));

  const { queryByText } = render(
    <ReactQueryTestWrapper>
      <OSAndArchitectureStep />
    </ReactQueryTestWrapper>,
  );

  // Release stream selection should be hidden
  expect(queryByText('Release stream')).not.toBeInTheDocument();
});

it('shows support end dates in OS version dropdown', async () => {
  const user = userEvent.setup();
  const { getByTestId, getByText } = render(
    <ReactQueryTestWrapper>
      <OSAndArchitectureStep />
    </ReactQueryTestWrapper>,
  );

  // open OS version dropdown
  const dropdown = getByTestId('restrict_to_os_version');
  await user.click(dropdown);

  expect(
    getByText('Full support ends: April 2026 | Maintenance support ends: April 2026'),
  ).toBeInTheDocument();
});
