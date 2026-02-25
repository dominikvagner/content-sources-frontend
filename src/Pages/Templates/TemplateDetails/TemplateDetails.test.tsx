import { render } from '@testing-library/react';
import TemplateDetails from './TemplateDetails';
import { defaultTemplateItem, defaultEUSupportTemplateItem } from 'testingHelpers';
import { useFetchTemplate } from 'services/Templates/TemplateQueries';
import useDistributionDetails from '../../../Hooks/useDistributionDetails';

jest.mock('react-router-dom', () => ({
  useParams: () => ({ templateUUID: defaultTemplateItem.uuid }),
  useNavigate: () => jest.fn(),
  Outlet: () => <></>,
}));

jest.mock('Hooks/useRootPath', () => () => 'someUrl');

jest.mock('services/Templates/TemplateQueries', () => ({
  useFetchTemplate: jest.fn(),
}));

jest.mock('../../../Hooks/useDistributionDetails', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('./components/TemplateDetailsTabs', () => () => 'TemplateDetailsTabs');
jest.mock('./components/TemplateActionDropdown', () => () => 'TemplateActionDropdown');

it('renders standard template details correctly', () => {
  const versionName = `el${defaultTemplateItem.version}`;

  (useFetchTemplate as jest.Mock).mockImplementation(() => ({
    data: defaultTemplateItem,
    isError: false,
    error: null,
    isLoading: false,
  }));

  (useDistributionDetails as jest.Mock).mockImplementation(() => ({
    isError: false,
    isLoading: false,
    getArchName: () => defaultTemplateItem.arch,
    getVersionName: () => versionName,
  }));

  const { getAllByText, queryByText } = render(<TemplateDetails />);

  expect(queryByText('TemplateDetailsTabs')).toBeInTheDocument();
  expect(getAllByText(defaultTemplateItem.name)).toHaveLength(2); // Two instances of the template name for the breadcrumb and template title
  expect(queryByText(versionName)).toBeInTheDocument();
  expect(queryByText(defaultTemplateItem.arch)).toBeInTheDocument();
});

it('renders EUS template details correctly', () => {
  const minorVersionName = `el${defaultEUSupportTemplateItem.extended_release_version}`;

  (useFetchTemplate as jest.Mock).mockImplementation(() => ({
    data: defaultEUSupportTemplateItem,
    isError: false,
    error: null,
    isLoading: false,
  }));

  (useDistributionDetails as jest.Mock).mockImplementation(() => ({
    isError: false,
    isLoading: false,
    getArchName: () => defaultEUSupportTemplateItem.arch,
    getMinorVersionName: () => minorVersionName,
    getStreamName: () => 'Extended Update Support (EUS)',
  }));

  const { getAllByText, queryByText } = render(<TemplateDetails />);

  expect(queryByText('TemplateDetailsTabs')).toBeInTheDocument();
  expect(getAllByText(defaultEUSupportTemplateItem.name)).toHaveLength(2);
  expect(queryByText(minorVersionName)).toBeInTheDocument();
  expect(queryByText('EUS')).toBeInTheDocument(); // The EUS label at the top of the page
  expect(queryByText(defaultEUSupportTemplateItem.arch)).toBeInTheDocument();
});
