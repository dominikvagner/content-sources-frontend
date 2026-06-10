import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SnapshotListModal from './SnapshotListModal';
import {
  ReactQueryTestWrapper,
  defaultContentItemWithSnapshot,
  defaultMetaItem,
  defaultSnapshotItem,
} from 'testingHelpers';
import { useFetchContent, useGetSnapshotList } from 'services/Content/ContentQueries';
import { ContentOrigin } from 'services/Content/ContentApi';
import { SnapshotDetailTab } from '../SnapshotDetailsModal/SnapshotDetailsModal';

const mockNavigate = jest.fn();

jest.mock('Hooks/useRootPath', () => () => 'someUrl');

jest.mock('services/Content/ContentQueries', () => ({
  useFetchContent: jest.fn(),
  useGetSnapshotList: jest.fn(),
  useGetRepoConfigFileQuery: () => ({ mutateAsync: jest.fn() }),
  useGetLatestRepoConfigFileQuery: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Outlet: () => <></>,
  useParams: () => ({
    repoUUID: 'some-uuid',
  }),
}));

jest.mock('middleware/AppContext', () => ({
  useAppContext: () => ({
    rbac: { read: true, write: true },
    contentOrigin: [ContentOrigin.EXTERNAL, ContentOrigin.UPLOAD],
  }),
}));

it('Render 1 item', () => {
  mockNavigate.mockClear();
  (useFetchContent as jest.Mock).mockImplementation(() => ({
    data: defaultContentItemWithSnapshot,
  }));
  (useGetSnapshotList as jest.Mock).mockImplementation(() => ({
    data: {
      meta: defaultMetaItem,
      data: [defaultSnapshotItem],
    },
    isLoading: false,
    isFetching: false,
  }));
  const { getByText } = render(
    <ReactQueryTestWrapper>
      <SnapshotListModal />
    </ReactQueryTestWrapper>,
  );

  expect(getByText('View list of snapshots for AwesomeNamewwyylse12.')).toBeInTheDocument();
  expect(getByText('Latest Snapshot Config:')).toBeInTheDocument();
  expect(
    getByText((defaultSnapshotItem.content_counts['rpm.package'] as number)?.toString()),
  ).toBeInTheDocument();
});

it('Render 20 items', () => {
  mockNavigate.mockClear();
  (useFetchContent as jest.Mock).mockImplementation(() => ({
    data: defaultContentItemWithSnapshot,
  }));
  (useGetSnapshotList as jest.Mock).mockImplementation(() => ({
    data: {
      meta: { defaultMetaItem, count: 21 }, // Make count larger so next button is available for pagination
      data: Array(20)
        .fill(defaultSnapshotItem)
        .map((val, index) => ({
          ...val,
          name: index + val.name,
          content_counts: {
            ...val.content_counts,
            'rpm.package': val.content_counts['rpm.package'] + index,
          },
        })),
    },
    isLoading: false,
    isFetching: false,
  }));

  const { getByText } = render(
    <ReactQueryTestWrapper>
      <SnapshotListModal />
    </ReactQueryTestWrapper>,
  );

  expect(getByText('View list of snapshots for AwesomeNamewwyylse12.')).toBeInTheDocument();
  expect(getByText('Latest Snapshot Config:')).toBeInTheDocument();

  expect(
    getByText((defaultSnapshotItem.content_counts['rpm.package'] as number)?.toString()),
  ).toBeInTheDocument();
});

it('navigates to the changes tab from the change column', async () => {
  const user = userEvent.setup();
  mockNavigate.mockClear();
  (useFetchContent as jest.Mock).mockImplementation(() => ({
    data: defaultContentItemWithSnapshot,
  }));
  (useGetSnapshotList as jest.Mock).mockImplementation(() => ({
    data: {
      meta: defaultMetaItem,
      data: [defaultSnapshotItem],
    },
    isLoading: false,
    isFetching: false,
  }));

  render(
    <ReactQueryTestWrapper>
      <SnapshotListModal />
    </ReactQueryTestWrapper>,
  );

  await user.click(screen.getByRole('button', { name: 'View snapshot changes' }));

  expect(mockNavigate).toHaveBeenCalledWith(
    `someUrl/repositories/some-uuid/snapshots/${defaultSnapshotItem.uuid}?tab=${SnapshotDetailTab.CHANGES}`,
  );
});

it('disables the changes link when a snapshot has no package changes', () => {
  mockNavigate.mockClear();
  (useFetchContent as jest.Mock).mockImplementation(() => ({
    data: defaultContentItemWithSnapshot,
  }));
  (useGetSnapshotList as jest.Mock).mockImplementation(() => ({
    data: {
      meta: defaultMetaItem,
      data: [
        {
          ...defaultSnapshotItem,
          added_counts: { ...defaultSnapshotItem.added_counts, 'rpm.package': 0 },
          removed_counts: { ...defaultSnapshotItem.removed_counts, 'rpm.package': 0 },
        },
      ],
    },
    isLoading: false,
    isFetching: false,
  }));

  render(
    <ReactQueryTestWrapper>
      <SnapshotListModal />
    </ReactQueryTestWrapper>,
  );

  expect(screen.getByRole('button', { name: 'View snapshot changes' })).toBeDisabled();
});
