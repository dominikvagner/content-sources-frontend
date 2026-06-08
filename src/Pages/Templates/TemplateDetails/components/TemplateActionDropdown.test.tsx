import { fireEvent, render, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import TemplateActionDropdown from './TemplateActionDropdown';
import { COPY_ROUTE, DELETE_ROUTE, EDIT_ROUTE, TEMPLATES_ROUTE } from 'Routes/constants';
import { ReactQueryTestWrapper } from 'testingHelpers';

const mockNavigate = jest.fn();
const templateUUID = 'templateUUID';

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useParams: () => ({ templateUUID }),
  useLocation: () => ({ pathname: `/app/${TEMPLATES_ROUTE}/${templateUUID}/systems` }),
}));

jest.mock('services/Templates/TemplateQueries', () => ({
  useDeleteTemplateItemMutate: () => ({ mutate: () => undefined, isLoading: false }),
}));

jest.mock('middleware/AppContext', () => ({
  useAppContext: () => ({
    rbac: { templateWrite: true },
    subscriptions: { red_hat_enterprise_linux: true },
  }),
}));

beforeEach(() => {
  mockNavigate.mockClear();
  (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
});

const openActionsMenu = async (queryByText: (text: string) => HTMLElement | null) => {
  await waitFor(() => fireEvent.click(queryByText('Actions') as Element));
};

it('expect TemplateActionDropdown to render all buttons', async () => {
  const { queryByText } = render(
    <ReactQueryTestWrapper>
      <TemplateActionDropdown />
    </ReactQueryTestWrapper>,
  );

  expect(queryByText('Actions')).toBeInTheDocument();

  await openActionsMenu(queryByText);
  expect(queryByText('Edit')).toBeInTheDocument();
  expect(queryByText('Copy')).toBeInTheDocument();
  expect(queryByText('Delete')).toBeInTheDocument();
});

describe('TemplateActionDropdown navigation', () => {
  it('navigates to edit route with details state', async () => {
    const { queryByText } = render(
      <ReactQueryTestWrapper>
        <TemplateActionDropdown />
      </ReactQueryTestWrapper>,
    );

    await openActionsMenu(queryByText);
    fireEvent.click(queryByText('Edit') as Element);

    expect(mockNavigate).toHaveBeenCalledWith(
      `/app/${TEMPLATES_ROUTE}/${templateUUID}/${EDIT_ROUTE}`,
      { state: { from: 'details' } },
    );
  });

  it('navigates to copy route with details state', async () => {
    const { queryByText } = render(
      <ReactQueryTestWrapper>
        <TemplateActionDropdown />
      </ReactQueryTestWrapper>,
    );

    await openActionsMenu(queryByText);
    fireEvent.click(queryByText('Copy') as Element);

    expect(mockNavigate).toHaveBeenCalledWith(
      `/app/${TEMPLATES_ROUTE}/${templateUUID}/${COPY_ROUTE}`,
      { state: { from: 'details' } },
    );
  });

  it('navigates to delete route from details', async () => {
    const { queryByText } = render(
      <ReactQueryTestWrapper>
        <TemplateActionDropdown />
      </ReactQueryTestWrapper>,
    );

    await openActionsMenu(queryByText);
    fireEvent.click(queryByText('Delete') as Element);

    expect(mockNavigate).toHaveBeenCalledWith(
      `/app/${TEMPLATES_ROUTE}/${templateUUID}/${DELETE_ROUTE}`,
    );
  });
});
