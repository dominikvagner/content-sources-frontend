import { render } from '@testing-library/react';
import { testEUSRepositoryParamsResponse } from 'testingHelpers';
import TemplateFilters from './TemplateFilters';
import { useQueryClient } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

jest.mock('middleware/AppContext', () => ({
  useAppContext: () => ({}),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('@tanstack/react-query');

beforeAll(() => {
  (useQueryClient as jest.Mock).mockImplementation(() => ({
    getQueryData: () => testEUSRepositoryParamsResponse,
  }));
});

it('Render loading state (disabled)', async () => {
  const { getByRole } = render(
    <TemplateFilters
      isLoading={true}
      setFilterData={() => null}
      filterData={{
        search: '',
        version: [],
        extended_release_version: [],
        arch: '',
        repository_uuids: '',
        snapshot_uuids: '',
        extended_release: [],
      }}
    />,
  );

  const filterInput = getByRole('button', { name: 'filterSelectionDropdown' });
  expect(filterInput).toHaveAttribute('disabled');
});

it('Select a filter of each type and ensure chips are present', async () => {
  const { queryByText, getByRole, getByLabelText, queryAllByText } = render(
    <TemplateFilters
      setFilterData={() => null}
      filterData={{
        search: '',
        version: [],
        extended_release_version: [],
        arch: '',
        repository_uuids: '',
        snapshot_uuids: '',
        extended_release: [],
      }}
    />,
  );

  const filterInput = getByRole('searchbox', { name: '' });
  expect(filterInput).not.toHaveAttribute('disabled');

  await userEvent.type(filterInput, 'EPEL');
  expect(filterInput).toHaveValue('EPEL');

  const optionMenu = getByRole('button', { name: 'filterSelectionDropdown' });

  await userEvent.click(optionMenu);

  // Select major and minor version items
  const versionOption = getByRole('menuitem', { name: 'Operating system' });
  expect(versionOption).toBeInTheDocument();
  await userEvent.click(versionOption);

  const versionSelector = getByRole('button', { name: 'filter operating system' }) as Element;
  await userEvent.click(versionSelector);

  const majorVersionItem = queryByText('RHEL 8') as Element;
  expect(majorVersionItem).toBeInTheDocument();
  await userEvent.click(majorVersionItem);

  const minorVersionItem = queryByText('RHEL 9.4') as Element;
  expect(minorVersionItem).toBeInTheDocument();
  await userEvent.click(minorVersionItem);

  await userEvent.click(optionMenu);

  // Select a release stream item
  const streamOption = getByRole('menuitem', { name: 'Release stream' });
  expect(streamOption).toBeInTheDocument();
  await userEvent.click(streamOption);

  const streamSelector = getByRole('button', { name: 'filter stream' }) as Element;
  await userEvent.click(streamSelector);

  const streamItem = queryByText('Standard') as Element;
  expect(streamItem).toBeInTheDocument();
  await userEvent.click(streamItem);

  await userEvent.click(optionMenu);

  // Select an architecture item
  const archOption = queryByText('Architecture') as Element;
  expect(archOption).toBeInTheDocument();
  await userEvent.click(archOption);

  const archSelector = getByLabelText('filter architecture') as Element;
  expect(archSelector).toBeInTheDocument();
  await userEvent.click(archSelector);

  const archItem = queryByText('aarch64') as Element;
  expect(archItem).toBeInTheDocument();
  await userEvent.click(archItem);

  // Check all the chips are there
  expect(queryByText('EPEL')).toBeInTheDocument();
  expect(queryByText('RHEL 8')).toBeInTheDocument();
  expect(queryByText('RHEL 9.4')).toBeInTheDocument();
  expect(queryByText('Standard')).toBeInTheDocument();
  expect(queryAllByText('aarch64')).toHaveLength(3); // aarch64 displayed in the filter dropdown, the filter label, and the filter chip
});
