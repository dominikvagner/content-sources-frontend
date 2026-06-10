import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SnapshotChangesTab } from './SnapshotChangesTab';
import { useGetSnapshotDetailQuery } from 'services/Content/ContentQueries';
import {
  defaultPackageItem,
  defaultRemovedPackageItem,
  defaultSnapshotDetailItem,
} from 'testingHelpers';

const mockOnClose = jest.fn();

jest.mock('services/Content/ContentQueries', () => ({
  useGetSnapshotDetailQuery: jest.fn(),
}));

jest.mock('Hooks/navigation/useNavigateTo', () => ({
  useNavigateTo: () => mockOnClose,
}));

jest.mock('react-router-dom', () => ({
  useParams: () => ({
    repoUUID: '11111111-1111-4111-8111-111111111111',
    snapshotUUID: '22222222-2222-4222-8222-222222222222',
  }),
}));

describe('SnapshotChangesTab', () => {
  beforeEach(() => {
    mockOnClose.mockClear();
    localStorage.clear();
  });

  const mockSnapshotDetail = (overrides = {}) => {
    (useGetSnapshotDetailQuery as jest.Mock).mockImplementation(() => ({
      isLoading: false,
      isFetching: false,
      isError: false,
      data: {
        ...defaultSnapshotDetailItem,
        ...overrides,
      },
    }));
  };

  it('renders add, remove, and update icons in the name column', () => {
    mockSnapshotDetail({
      added_packages: [
        { ...defaultPackageItem, name: 'bash', version: '5.2.0', release: '1.el9' },
        { ...defaultPackageItem, name: 'dnf', version: '4.18.0', release: '3.el9' },
      ],
      removed_packages: [
        { ...defaultRemovedPackageItem, name: 'dnf', version: '4.14.0', release: '1.el9' },
        { ...defaultRemovedPackageItem, name: 'vim', version: '9.0.0', release: '2.el9' },
      ],
    });

    render(<SnapshotChangesTab />);

    const grid = screen.getByRole('grid', { name: 'Snapshot changes table' });

    expect(within(grid).getAllByRole('row')).toHaveLength(4);
    expect(screen.getByText('bash')).toBeInTheDocument();
    expect(screen.getAllByText('dnf')).toHaveLength(2);
    expect(screen.getByText('vim')).toBeInTheDocument();
    expect(screen.getByText('4.18.0')).toBeInTheDocument();
    expect(screen.getByText('4.14.0')).toBeInTheDocument();
    expect(screen.getByText('replacing')).toBeInTheDocument();
    expect(screen.getByLabelText('Added package')).toBeInTheDocument();
    expect(screen.getByLabelText('Removed package')).toBeInTheDocument();
    expect(screen.getByLabelText('Updated package')).toBeInTheDocument();
  });

  it('filters rows by package name', async () => {
    const user = userEvent.setup();

    mockSnapshotDetail({
      added_packages: [
        { ...defaultPackageItem, name: 'bash' },
        { ...defaultPackageItem, name: 'dnf' },
      ],
      removed_packages: [{ ...defaultRemovedPackageItem, name: 'vim' }],
    });

    render(<SnapshotChangesTab />);

    const grid = screen.getByRole('grid', { name: 'Snapshot changes table' });

    await user.type(screen.getByPlaceholderText('Filter by name'), 'vim');

    expect(within(grid).queryByText('bash')).not.toBeInTheDocument();
    expect(within(grid).queryByText('dnf')).not.toBeInTheDocument();
    expect(within(grid).getAllByText('vim').length).toBeGreaterThan(0);
  });

  it('pages through merged rows locally', async () => {
    const user = userEvent.setup();
    localStorage.setItem('snapshotChangesPerPage', '1');

    mockSnapshotDetail({
      added_packages: [
        { ...defaultPackageItem, name: 'bash' },
        { ...defaultPackageItem, name: 'dnf' },
      ],
      removed_packages: [{ ...defaultRemovedPackageItem, name: 'vim' }],
    });

    render(<SnapshotChangesTab />);

    const grid = screen.getByRole('grid', { name: 'Snapshot changes table' });

    expect(within(grid).getByText('bash')).toBeInTheDocument();
    expect(within(grid).queryByText('dnf')).not.toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /Go to next page/i })[0]);

    expect(within(grid).getByText('dnf')).toBeInTheDocument();
  });

  it('shows an empty state when there are no package changes', () => {
    mockSnapshotDetail({
      added_packages: [],
      removed_packages: [],
    });

    render(<SnapshotChangesTab />);

    expect(screen.getByText('No package changes')).toBeInTheDocument();
    expect(screen.getByText('This snapshot has no package changes.')).toBeInTheDocument();
  });
});
