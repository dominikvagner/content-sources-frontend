import { render } from '@testing-library/react';
import {
  ReactQueryTestWrapper,
  defaultSnapshotItem,
  defaultTemplateItem,
  defaultTemplateItem2,
} from 'testingHelpers';
import DeleteSnapshotsModal from './DeleteSnapshotsModal';
import {DELETE_ROUTE} from 'Routes/constants';
import {useGetSnapshotList} from 'services/Content/ContentQueries';
import {useFetchTemplatesForSnapshots} from 'services/Templates/TemplateQueries';
import { TemplateItem } from 'services/Templates/TemplateApi'
import {formatDateDDMMMYYYY} from 'helpers';

jest.mock('react-query', () => ({
  ...jest.requireActual('react-query'),
  useQueryClient: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useLocation: () => ({
    search: `${DELETE_ROUTE}?snapshotUUID=${defaultSnapshotItem.uuid}`,
  }),
  useHref: () => 'insights/content/repositories',
}));

jest.mock('../SnapshotListModal', () => ({
  useSnapshotListOutletContext: () => ({
    clearCheckedRepositories: () => undefined,
    deletionContext: {
      checkedRepositories: new Set<string>(defaultSnapshotItem.uuid),
    },
  }),
}));

jest.mock('Hooks/useRootPath', () => () => 'someUrl');

jest.mock('services/Content/ContentQueries', () => ({
  useBulkDeleteSnapshotsMutate: () => ({ isLoading: false }),
  useGetSnapshotList: jest.fn(),
}));

jest.mock('services/Templates/TemplateQueries', () => ({
  useFetchTemplatesForSnapshots: jest.fn(),
}));

jest.mock('middleware/AppContext', () => ({
  useAppContext: () => ({
    features: { snapshots: { accessible: true } },
    rbac: { repoWrite: true, repoRead: true },
  }),
}));

//
it('Render delete modal where repo is not included in any templates', () => {
  (useGetSnapshotList as jest.Mock).mockImplementation(() => ({
    data: {
      isLoading: false,
      data: [defaultSnapshotItem],
    },
  }));
  (useFetchTemplatesForSnapshots as jest.Mock).mockImplementation(() => ({
    data: {
      data: new Map<string, TemplateItem[]>([[defaultSnapshotItem.uuid, []]]),
    },
  }));

  const { queryByText } = render(
    <ReactQueryTestWrapper>
      <DeleteSnapshotsModal />
    </ReactQueryTestWrapper>,
  );

  expect(queryByText(formatDateDDMMMYYYY(defaultSnapshotItem.created_at))).toBeInTheDocument();
  expect(queryByText(defaultTemplateItem.name)).not.toBeInTheDocument();
  expect(queryByText(defaultTemplateItem2.name)).not.toBeInTheDocument();
  expect(queryByText('None')).toBeInTheDocument();
});
