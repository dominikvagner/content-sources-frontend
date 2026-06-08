import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { AddOrEditTemplateModal } from './AddOrEditTemplateModal';
import { useAddOrEditTemplateContext } from './AddOrEditTemplateContext';
import { defaultTemplateItem } from 'testingHelpers';
import { TEMPLATES_ROUTE } from 'Routes/constants';

const mockNavigate = jest.fn();
const mockSetSearchParams = jest.fn();

jest.mock('./steps/OSAndArchitectureStep', () => ({ __esModule: true, default: () => null }));
jest.mock('./steps/RedHatRepositoriesStep', () => ({ __esModule: true, default: () => null }));
jest.mock('./steps/CustomRepositoriesStep', () => ({ __esModule: true, default: () => null }));
jest.mock('./steps/SetUpDateStep', () => ({ __esModule: true, default: () => null }));
jest.mock('./steps/DetailStep', () => ({ __esModule: true, default: () => null }));
jest.mock('./steps/ReviewStep', () => ({ __esModule: true, default: () => null }));
jest.mock('./AddTemplateButton', () => ({
  AddTemplateButton: () => null,
}));

jest.mock('services/Templates/TemplateQueries', () => ({
  useCreateTemplateQuery: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useEditTemplateQuery: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock('Hooks/useRootPath', () => () => '/app');

jest.mock('./AddOrEditTemplateContext', () => ({
  AddOrEditTemplateContextProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useAddOrEditTemplateContext: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: jest.fn(),
  useSearchParams: () => [new URLSearchParams('tab=os-and-architecture'), mockSetSearchParams],
}));

const mockContext = (overrides = {}) => ({
  isEdit: true,
  isCopy: false,
  templateRequest: defaultTemplateItem,
  hasInvalidSteps: () => false,
  editUUID: defaultTemplateItem.uuid,
  isSourceTemplateReady: true,
  isNameTaken: false,
  queryClient: {} as never,
  ...overrides,
});

const mockLocation = (from?: 'table' | 'details') => ({
  pathname: `/app/templates/edit/${defaultTemplateItem.uuid}`,
  state: from ? { from } : {},
});

describe('AddOrEditTemplateModal navigation', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockSetSearchParams.mockClear();
    (useAddOrEditTemplateContext as jest.Mock).mockImplementation(() => mockContext());
    (useLocation as jest.Mock).mockImplementation(() => mockLocation('table'));
  });

  it('navigates to templates list on cancel when opened from table', async () => {
    const user = userEvent.setup();

    render(<AddOrEditTemplateModal />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockNavigate).toHaveBeenCalledWith(`/app/${TEMPLATES_ROUTE}`);
  });

  it('navigates to template details on cancel when opened from details', async () => {
    (useLocation as jest.Mock).mockImplementation(() => mockLocation('details'));
    const user = userEvent.setup();

    render(<AddOrEditTemplateModal />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockNavigate).toHaveBeenCalledWith(
      `/app/${TEMPLATES_ROUTE}/${defaultTemplateItem.uuid}`,
    );
  });

  it('navigates to template details on cancel when copying from details', async () => {
    (useLocation as jest.Mock).mockImplementation(() => ({
      pathname: `/app/templates/copy/${defaultTemplateItem.uuid}`,
      state: { from: 'details' },
    }));
    (useAddOrEditTemplateContext as jest.Mock).mockImplementation(() =>
      mockContext({ isEdit: false, isCopy: true }),
    );
    const user = userEvent.setup();

    render(<AddOrEditTemplateModal />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockNavigate).toHaveBeenCalledWith(
      `/app/${TEMPLATES_ROUTE}/${defaultTemplateItem.uuid}`,
    );
  });
});
