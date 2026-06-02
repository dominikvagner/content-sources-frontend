import { render } from '@testing-library/react';
import { ReactQueryTestWrapper, defaultSystemsListItem, defaultTemplateItem } from 'testingHelpers';

import DeleteTemplateModal from './DeleteTemplateModal';
import { useListSystemsByTemplateId } from 'services/Systems/SystemsQueries';
import { useFetchTemplate } from 'services/Templates/TemplateQueries';
import { DETAILS_ROUTE } from 'Routes/constants';

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
  })),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn,
  useLocation: () => ({
    pathname: `/mocked/${DETAILS_ROUTE}`,
  }),
}));

jest.mock('Hooks/useRootPath', () => () => 'someUrl');

jest.mock('Hooks/useSafeUUIDParam', () => () => defaultTemplateItem.uuid);

jest.mock('services/Systems/SystemsQueries', () => ({
  useListSystemsByTemplateId: jest.fn(),
}));

jest.mock('services/Templates/TemplateQueries', () => ({
  useDeleteTemplateItemMutate: () => ({ mutate: () => undefined, isLoading: false }),
  useFetchTemplate: jest.fn(),
}));

jest.mock('middleware/AppContext', () => ({ useAppContext: () => ({}) }));

it('Render delete modal where there are no systems', () => {
  (useListSystemsByTemplateId as jest.Mock).mockImplementation(() => ({
    isTemplateSystemsLoading: false,
    data: {
      data: [],
      meta: { total_items: 0 },
    },
  }));
  (useFetchTemplate as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: { name: 'test' },
  }));

  const { queryByText } = render(
    <ReactQueryTestWrapper>
      <DeleteTemplateModal />
    </ReactQueryTestWrapper>,
  );

  expect(queryByText('This template is in use.')).toBeNull();
  expect(
    queryByText('Template and all its data will be deleted. This action cannot be undone.'),
  ).toBeInTheDocument();
  expect(queryByText('test')).toBeInTheDocument();
});

it('Render delete modal where template has one system', () => {
  (useListSystemsByTemplateId as jest.Mock).mockImplementation(() => ({
    isTemplateSystemsLoading: false,
    data: {
      data: [defaultSystemsListItem],
      meta: { total_items: 1 },
    },
  }));
  (useFetchTemplate as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: { name: 'test' },
  }));

  const { queryByText } = render(
    <ReactQueryTestWrapper>
      <DeleteTemplateModal />
    </ReactQueryTestWrapper>,
  );

  expect(queryByText('This template is in use.')).toBeInTheDocument();
  expect(
    queryByText('Template and all its data will be deleted. This action cannot be undone.'),
  ).toBeInTheDocument();
  expect(queryByText('test')).toBeInTheDocument();
});
