import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SnapshotSelector } from './SnapshotSelector';
import { useGetSnapshotList } from 'services/Content/ContentQueries';
import { defaultMetaItem, defaultSnapshotItem } from 'testingHelpers';
import { formatDateDDMMMYYYY } from 'helpers';
import { SnapshotDetailTab } from './SnapshotDetailsModal';

const mockNavigate = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('Hooks/useRootPath', () => () => 'someUrl');

jest.mock('services/Content/ContentQueries', () => ({
  useGetSnapshotList: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
  useParams: () => ({
    repoUUID: 'repo-uuid',
    snapshotUUID: defaultSnapshotItem.uuid,
  }),
}));

describe('SnapshotSelector', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockSearchParams.delete('tab');
  });

  it('renders the selected snapshot label', () => {
    (useGetSnapshotList as jest.Mock).mockImplementation(() => ({
      data: {
        meta: defaultMetaItem,
        data: [defaultSnapshotItem],
      },
      isLoading: false,
      isFetching: false,
    }));

    render(<SnapshotSelector />);

    // This is testing the date format specifically.
    // if we update the date format, this test needs updating as well.
    const selectorElement = screen.getByText(
      formatDateDDMMMYYYY(defaultSnapshotItem.created_at, true),
    );
    expect(selectorElement).toBeInTheDocument();
  });

  it('preserves the active tab when selecting a different snapshot', async () => {
    const user = userEvent.setup();
    const alternateSnapshot = {
      ...defaultSnapshotItem,
      uuid: '11111111-1111-4111-8111-111111111111',
      created_at: '2024-02-08T20:23:32.711372-06:00',
    };

    mockSearchParams.set('tab', SnapshotDetailTab.CHANGES);

    (useGetSnapshotList as jest.Mock).mockImplementation(() => ({
      data: {
        meta: { ...defaultMetaItem, count: 2 },
        data: [defaultSnapshotItem, alternateSnapshot],
      },
      isLoading: false,
      isFetching: false,
    }));

    render(<SnapshotSelector />);

    await user.click(screen.getByRole('button', { name: 'snapshot selector' }));
    await user.click(
      screen.getByRole('menuitem', {
        name: formatDateDDMMMYYYY(alternateSnapshot.created_at, true),
      }),
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      `someUrl/repositories/repo-uuid/snapshots/${alternateSnapshot.uuid}?tab=${SnapshotDetailTab.CHANGES}`,
    );
  });
});
