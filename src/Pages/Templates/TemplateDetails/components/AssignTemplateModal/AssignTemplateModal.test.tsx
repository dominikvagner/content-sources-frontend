import { render, waitFor, screen, within } from '@testing-library/react';
import AssignTemplateModal from './AssignTemplateModal';
import { useQueryClient } from 'react-query';
import { useSystemsListQuery } from 'services/Systems/SystemsQueries';
import {
  defaultSystemsListItem,
  defaultTemplateItem,
  defaultUpdateTemplateTaskCompleted,
  minorReleaseSystemsListItem,
  satelliteManagedSystemsListItem,
} from 'testingHelpers';
import type { SystemItem } from 'services/Systems/SystemsApi';
import useCompatibleSystems from 'Hooks/useCompatibleSystems';
import React from 'react';
import { TEMPLATE_SYSTEMS_UPDATE_LIMIT } from 'Pages/Templates/TemplatesTable/constants';
import userEvent from '@testing-library/user-event';

const bananaUUID = 'banana-uuid';

jest.mock('react-router-dom', () => ({
  useParams: () => ({ templateUUID: bananaUUID }),
  useNavigate: jest.fn(),
  useSearchParams: () => [{ get: () => null }, jest.fn()],
}));

jest.mock('Hooks/useRootPath', () => () => 'someUrl');

jest.mock('Hooks/useCompatibleSystems');

jest.mock('react-query');

jest.mock('services/Systems/SystemsQueries', () => ({
  useAddTemplateToSystemsQuery: () => ({ mutate: () => undefined, isLoading: false }),
  useSystemsListQuery: jest.fn(),
}));

jest.mock('Hooks/useNotification', () => () => ({ notify: () => null }));

jest.mock('services/Templates/TemplateQueries', () => ({
  useFetchTemplate: () => ({ data: defaultTemplateItem }),
}));

// Conditionally mock SystemListView with a set number of systems selected
let mockSelectedSystemsCount = 0;
jest.mock('./SystemListView', () => {
  const actual = jest.requireActual('./SystemListView');
  const SystemListView = actual.default;

  return {
    __esModule: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: (props: any) => {
      const { setSelectedSystems, setCanAssignTemplate } = props;

      React.useEffect(() => {
        if (mockSelectedSystemsCount > 0) {
          setSelectedSystems(
            Array.from({ length: mockSelectedSystemsCount }, (_, index) => `system-${index}`),
          );
          setCanAssignTemplate(
            mockSelectedSystemsCount > 0 &&
              mockSelectedSystemsCount <= TEMPLATE_SYSTEMS_UPDATE_LIMIT,
          );
        }
      }, [mockSelectedSystemsCount, setSelectedSystems, setCanAssignTemplate]);

      return <SystemListView {...props} />;
    },
  };
});

beforeAll(() => {
  (useQueryClient as jest.Mock).mockImplementation(() => ({
    getQueryData: () => ({
      version: 1,
      name: 'Steve the template',
      arch: 'x86_64',
      last_update_task: defaultUpdateTemplateTaskCompleted,
    }),
  }));
});

afterEach(() => {
  mockSelectedSystemsCount = 0;
});

(useCompatibleSystems as jest.Mock).mockReturnValue({
  hasCompatibleSystems: true,
  isFetchingCompatibility: false,
  isCompatibilityError: false,
});

(useSystemsListQuery as jest.Mock).mockImplementation(() => ({
  isLoading: false,
  isFetching: false,
  isError: false,
  data: undefined,
}));

it('shows registration view if no systems are present', async () => {
  (useCompatibleSystems as jest.Mock).mockImplementation(() => ({
    hasCompatibleSystems: false,
    isFetchingCompatibility: false,
    isCompatibilityError: false,
  }));
  render(<AssignTemplateModal />);
  expect(screen.getByText('Non-registered systems')).toBeInTheDocument();
});

it('renders systems list and pre-selects systems already assigned to template', async () => {
  (useCompatibleSystems as jest.Mock).mockImplementation(() => ({
    hasCompatibleSystems: true,
    isFetchingCompatibility: false,
    isCompatibilityError: false,
  }));
  (useSystemsListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    isError: false,
    data: {
      data: new Array(15).fill(defaultSystemsListItem).map((item: SystemItem, index) => ({
        ...item,
        id: item.id + index,
        attributes: {
          ...item.attributes,
          display_name: item.attributes.display_name + index,
          template_uuid: !index ? bananaUUID : item.attributes.template_uuid,
        },
      })),
      meta: { total_items: 15, limit: 20, offset: 0 },
    },
  }));
  render(<AssignTemplateModal />);

  expect(screen.getByText('14867.host.example.com14')).toBeInTheDocument();

  // ensure first item is pre-selected
  expect(screen.getByRole('checkbox', { name: 'Select row 0', checked: true })).toBeInTheDocument();
  expect(
    screen.getByRole('checkbox', { name: 'Select row 1', checked: false }),
  ).toBeInTheDocument();
});

it('prevents selection of systems with minor release versions and shows warning icon', async () => {
  (useCompatibleSystems as jest.Mock).mockImplementation(() => ({
    hasCompatibleSystems: true,
    isFetchingCompatibility: false,
    isCompatibilityError: false,
  }));
  (useSystemsListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    isError: false,
    data: {
      data: [defaultSystemsListItem, minorReleaseSystemsListItem],
      meta: { total_items: 2, limit: 20, offset: 0 },
    },
  }));
  render(<AssignTemplateModal />);

  await waitFor(() => {
    expect(screen.getAllByRole('row')).toHaveLength(3); // 1 header + 2 data rows
  });

  expect(screen.getByText('14867.host.example.com')).toBeInTheDocument();
  expect(screen.getByText('40098.host.example.com')).toBeInTheDocument();

  expect(screen.getByRole('checkbox', { name: 'Select row 0' })).toBeEnabled();
  expect(screen.getByRole('checkbox', { name: 'Select row 1' })).toBeDisabled();

  // Warning icon should be present for minor release system
  const warningIcon = screen.getByTestId('system-list-warning-icon');
  expect(warningIcon).toBeInTheDocument();

  // Verify the warning icon is in the same row as the minor release system
  expect(
    within(warningIcon.closest('tr')!).getByText('40098.host.example.com'),
  ).toBeInTheDocument();
});

it('prevents selection of satellite-managed systems and shows warning icon', async () => {
  (useCompatibleSystems as jest.Mock).mockImplementation(() => ({
    hasCompatibleSystems: true,
    isFetchingCompatibility: false,
    isCompatibilityError: false,
  }));
  (useSystemsListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    isError: false,
    data: {
      data: [defaultSystemsListItem, satelliteManagedSystemsListItem],
      meta: { total_items: 2, limit: 20, offset: 0 },
    },
  }));
  render(<AssignTemplateModal />);

  await waitFor(() => {
    expect(screen.getAllByRole('row')).toHaveLength(3); // 1 header + 2 data rows
  });

  expect(screen.getByText('14867.host.example.com')).toBeInTheDocument();
  expect(screen.getByText('69204.host.example.com')).toBeInTheDocument();

  expect(screen.getByRole('checkbox', { name: 'Select row 0' })).toBeEnabled();
  expect(screen.getByRole('checkbox', { name: 'Select row 1' })).toBeDisabled();

  // Warning icon should be present for satellite-managed system
  const warningIcon = screen.getByTestId('system-list-warning-icon');
  expect(warningIcon).toBeInTheDocument();

  // Verify the warning icon is in the same row as the satellite-managed system
  expect(
    within(warningIcon.closest('tr')!).getByText('69204.host.example.com'),
  ).toBeInTheDocument();
});

it('prevents assigning a template when more than 1000 systems are selected', async () => {
  // Render the modal with mock SystemListView
  mockSelectedSystemsCount = TEMPLATE_SYSTEMS_UPDATE_LIMIT + 1;

  render(<AssignTemplateModal />);

  expect(await screen.findByText(`Selected (${mockSelectedSystemsCount})`)).toBeInTheDocument();

  const saveButton = screen.getByRole('button', { name: 'Save' });
  expect(saveButton).toBeDisabled();

  await userEvent.hover(saveButton);
  expect(
    await screen.findByText(
      `Cannot assign a template to more than ${TEMPLATE_SYSTEMS_UPDATE_LIMIT} systems at a time.`,
    ),
  ).toBeInTheDocument();
});
