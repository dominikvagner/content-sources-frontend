import { render } from '@testing-library/react';
import { useAddOrEditTemplateContext } from '../AddOrEditTemplateContext';
import { defaultContentItem, defaultTemplateItem } from 'testingHelpers';
import { useContentListQuery } from 'services/Content/ContentQueries';
import RedHatRepositoriesStep from './RedHatRepositoriesStep';
import useDistributionDetails from '../../../../../../Hooks/useDistributionDetails';

jest.mock('services/Content/ContentQueries', () => ({
  useContentListQuery: jest.fn(),
}));

jest.mock('Pages/Repositories/ContentListTable/components/StatusIcon', () => () => 'StatusIcon');

jest.mock('../AddOrEditTemplateContext', () => ({
  useAddOrEditTemplateContext: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  Outlet: () => <></>,
  useHref: () => 'insights/content/templates',
}));

jest.mock('../../../../../../Hooks/useDistributionDetails', () => ({
  __esModule: true,
  default: jest.fn(),
}));

it('expect RedhatRepositoriesStep to render correctly', () => {
  (useContentListQuery as jest.Mock).mockImplementation(() => ({
    data: {
      data: [defaultContentItem],
      meta: { limit: 10, offset: 0, count: 1 },
      isLoading: false,
    },
  }));

  (useAddOrEditTemplateContext as jest.Mock).mockImplementation(() => ({
    templateRequest: defaultTemplateItem,
    setSelectedRedHatRepos: () => undefined,
    selectedRedHatRepos: new Set([defaultTemplateItem.uuid]),
    redHatCoreRepos: new Set([defaultTemplateItem.uuid]),
  }));

  (useDistributionDetails as jest.Mock).mockImplementation(() => ({
    isExtendedSupportAvailable: false,
  }));

  const { getByRole, getByText } = render(<RedHatRepositoriesStep />);

  const firstCheckboxInList = getByRole('checkbox', { name: 'Select row 0' });

  expect(firstCheckboxInList).toBeInTheDocument();

  expect(getByText(defaultContentItem.name)).toBeInTheDocument();
  expect(getByText(defaultContentItem.package_count + '')).toBeInTheDocument();
});
