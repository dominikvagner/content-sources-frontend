import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SnapshotDetailsModal, { SnapshotDetailTab } from './SnapshotDetailsModal';
import { useAppContext } from 'middleware/AppContext';
import { ContentOrigin } from 'services/Content/ContentApi';

const mockNavigate = jest.fn();
const mockSetSearchParams = jest.fn();

jest.mock('./Tabs/SnapshotPackagesTab', () => ({
  SnapshotPackagesTab: () => <div>Packages tab body</div>,
}));

jest.mock('./Tabs/SnapshotErrataTab', () => ({
  SnapshotErrataTab: () => <div>Errata tab body</div>,
}));

jest.mock('./Tabs/SnapshotChangesTab', () => ({
  SnapshotChangesTab: () => <div>Changes tab body</div>,
}));

jest.mock('./SnapshotSelector', () => ({
  SnapshotSelector: () => <div>Snapshot selector</div>,
}));

jest.mock('middleware/AppContext', () => ({
  useAppContext: jest.fn(),
}));

jest.mock('Hooks/useRootPath', () => () => '/app');

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ repoUUID: 'repo-uuid', snapshotUUID: 'snap-uuid' }),
  useSearchParams: () => {
    const params = new URLSearchParams(window.location.search);
    return [params, mockSetSearchParams];
  },
}));

describe('SnapshotDetailsModal', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockSetSearchParams.mockClear();
    window.history.replaceState({}, '', '/');
    (useAppContext as jest.Mock).mockReturnValue({
      contentOrigin: [],
    });
  });

  const clickModalHeaderClose = async (user: ReturnType<typeof userEvent.setup>) => {
    const dialog = screen.getByRole('dialog');
    // Footer uses aria-label "Close snapshot detail"; PatternFly header close stays "Close".
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
  };

  it('navigates back to repositories on close without origin query by default', async () => {
    const user = userEvent.setup();

    render(<SnapshotDetailsModal />);

    await clickModalHeaderClose(user);

    expect(mockNavigate).toHaveBeenCalledWith('/app/repositories');
  });

  it('appends origin query when only Red Hat is selected', async () => {
    const user = userEvent.setup();
    (useAppContext as jest.Mock).mockReturnValue({
      contentOrigin: [ContentOrigin.REDHAT],
    });

    render(<SnapshotDetailsModal />);

    await clickModalHeaderClose(user);

    expect(mockNavigate).toHaveBeenCalledWith('/app/repositories?origin=red_hat');
  });

  it('navigates to snapshots list when View all snapshots is clicked', async () => {
    const user = userEvent.setup();

    render(<SnapshotDetailsModal />);

    await user.click(screen.getByRole('button', { name: 'View all snapshots' }));

    expect(mockNavigate).toHaveBeenCalledWith('/app/repositories/repo-uuid/snapshots');
  });

  it('syncs errata tab from search params on mount', async () => {
    window.history.replaceState({}, '', `/?tab=${SnapshotDetailTab.ERRATA}`);

    render(<SnapshotDetailsModal />);

    await waitFor(() => {
      expect(
        screen.getByRole('tabpanel', { name: 'Snapshot errata detail tab' }),
      ).toBeInTheDocument();
    });
  });

  it('syncs changes tab from search params on mount', async () => {
    window.history.replaceState({}, '', `/?tab=${SnapshotDetailTab.CHANGES}`);

    render(<SnapshotDetailsModal />);

    await waitFor(() => {
      expect(
        screen.getByRole('tabpanel', { name: 'Snapshot changes detail tab' }),
      ).toBeInTheDocument();
    });
  });

  it('updates search params when switching tabs', async () => {
    const user = userEvent.setup();

    render(<SnapshotDetailsModal />);

    await user.click(screen.getByRole('tab', { name: 'Snapshot changes detail tab' }));

    expect(mockSetSearchParams).toHaveBeenCalledWith({ tab: SnapshotDetailTab.CHANGES });
  });

  it('renders tabs in the expected order', () => {
    render(<SnapshotDetailsModal />);

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Packages',
      'Changes',
      'Advisories',
    ]);
  });

  it('clears search params when switching back to packages', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', `/?tab=${SnapshotDetailTab.CHANGES}`);

    render(<SnapshotDetailsModal />);

    await user.click(screen.getByRole('tab', { name: 'Snapshot package detail tab' }));

    expect(mockSetSearchParams).toHaveBeenCalledWith({});
  });
});
