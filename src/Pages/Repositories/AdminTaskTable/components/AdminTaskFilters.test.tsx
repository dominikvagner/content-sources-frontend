import { render } from '@testing-library/react';
import AdminTaskFilters from './AdminTaskFilters';
import userEvent from '@testing-library/user-event';

jest.mock('middleware/AppContext', () => ({
  useAppContext: () => ({}),
}));

jest.mock('@tanstack/react-query');

it('Render loading state (disabled)', () => {
  const { getByRole } = render(
    <AdminTaskFilters
      isLoading={true}
      setFilterData={() => null}
      filterData={{
        statuses: [],
        accountId: '',
        orgId: '',
        typenames: [],
      }}
    />,
  );

  const filterInput = getByRole('searchbox', { name: '' });
  expect(filterInput).toHaveAttribute('disabled');
});

it('Select a filter of each type and ensure chips are present admin', async () => {
  const { queryByText, getByRole, getByLabelText, queryAllByText } = render(
    <AdminTaskFilters
      setFilterData={() => null}
      filterData={{
        statuses: [],
        accountId: '',
        orgId: '',
        typenames: [],
      }}
    />,
  );

  // Enter an account ID item
  const filterInput = getByRole('searchbox', { name: '' });
  expect(filterInput).not.toHaveAttribute('disabled');

  await userEvent.type(filterInput, '11593016');

  const optionMenu = getByRole('button', { name: 'filterSelectionDropdown' });
  await userEvent.click(optionMenu);

  const orgIdOption = queryByText('Org ID') as Element;
  expect(orgIdOption).toBeInTheDocument();
  await userEvent.click(orgIdOption);

  // Enter an org ID item

  await userEvent.type(filterInput, '13446804');
  expect(filterInput).toHaveValue('13446804');

  // Select a Status item
  await userEvent.click(optionMenu);
  const statusOption = queryByText('Status') as Element;
  expect(statusOption).toBeInTheDocument();
  await userEvent.click(statusOption);

  const statusSelector = getByLabelText('filter status') as Element;
  expect(statusSelector).toBeInTheDocument();
  await userEvent.click(statusSelector);

  const statusItem = queryByText('Running') as Element;
  expect(statusItem).toBeInTheDocument();
  await userEvent.click(statusItem);

  // Click the optionsButton to make the statusMenu disappear
  await userEvent.click(optionMenu);
  // Select a Type item
  const typeOption = queryByText('Type') as Element;
  expect(typeOption).toBeInTheDocument();
  await userEvent.click(typeOption);

  const typeSelector = getByLabelText('filter type') as Element;
  expect(typeSelector).toBeInTheDocument();
  await userEvent.click(typeSelector);

  const typeItem = queryByText('introspect') as Element;
  expect(typeItem).toBeInTheDocument();
  await userEvent.click(typeItem);

  // Click the optionsButton to make the typeMenu disappear
  await userEvent.click(typeSelector);

  // Check all the chips are there
  expect(queryByText('11593016')).toBeInTheDocument();
  expect(queryByText('13446804')).toBeInTheDocument();

  expect(queryByText('Running')).toBeInTheDocument();
  expect(queryAllByText('introspect')).toHaveLength(2);
});
