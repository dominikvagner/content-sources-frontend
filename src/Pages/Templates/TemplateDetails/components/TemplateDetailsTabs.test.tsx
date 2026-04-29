import { fireEvent, render, screen } from '@testing-library/react';
import TemplateDetailsTabs from './TemplateDetailsTabs';
import { defaultTemplateItem } from '../../../../testingHelpers';
import {
  ADVISORIES_ROUTE,
  CONTENT_ROUTE,
  PACKAGES_ROUTE,
  REPOSITORIES_ROUTE,
  SYSTEMS_ROUTE,
  TEMPLATES_ROUTE,
} from '../../../../Routes/constants';

const { uuid } = defaultTemplateItem;
const navigateMock = jest.fn();
const basePath = `/insights/content/${TEMPLATES_ROUTE}/${uuid}`;
let mockedPathname = `${basePath}/${SYSTEMS_ROUTE}`;

jest.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useLocation: () => ({ pathname: mockedPathname }),
}));

jest.mock('Hooks/useRootPath', () => () => 'insights/content');

jest.mock('Hooks/useSafeUUIDParam', () => () => uuid);

jest.mock('services/Templates/TemplateQueries', () => ({
  useDeleteTemplateItemMutate: () => ({ mutate: () => undefined, isLoading: false }),
}));

beforeEach(() => {
  mockedPathname = `${basePath}/${SYSTEMS_ROUTE}`;
  navigateMock.mockClear();
});

it('expect TemplateDetailsTabs to render all tabs, and have Systems selected', () => {
  render(<TemplateDetailsTabs />);
  expect(screen.queryByText('Packages')).toBeInTheDocument();
  expect(screen.queryByText('Advisories')).toBeInTheDocument();
  expect(screen.queryByText('Systems')).toBeInTheDocument();
  expect(screen.queryByText('Repositories'))!.toBeInTheDocument();
  expect(screen.queryByText('Systems')!.closest('button')).toHaveAttribute('aria-selected', 'true');
});

it('navigates to selected content subtab when Content tab is clicked', () => {
  mockedPathname = `${basePath}/${CONTENT_ROUTE}/${ADVISORIES_ROUTE}`;
  render(<TemplateDetailsTabs />);

  fireEvent.click(screen.getByRole('tab', { name: 'Template content detail tab' }));

  expect(navigateMock).toHaveBeenCalledWith(
    `insights/content/${TEMPLATES_ROUTE}/${uuid}/${CONTENT_ROUTE}/${ADVISORIES_ROUTE}`,
  );
});

it('navigates to systems route when Systems tab is clicked', () => {
  mockedPathname = `${basePath}/${CONTENT_ROUTE}/${PACKAGES_ROUTE}`;
  render(<TemplateDetailsTabs />);

  fireEvent.click(screen.getByRole('tab', { name: 'Template systems detail tab' }));

  expect(navigateMock).toHaveBeenCalledWith(
    `insights/content/${TEMPLATES_ROUTE}/${uuid}/${SYSTEMS_ROUTE}`,
  );
});

it('updates route when selecting a content subtab', () => {
  mockedPathname = `${basePath}/${CONTENT_ROUTE}/${PACKAGES_ROUTE}`;
  render(<TemplateDetailsTabs />);

  fireEvent.click(screen.getByRole('tab', { name: 'Template repositories detail tab' }));

  expect(navigateMock).toHaveBeenCalledWith(
    `insights/content/${TEMPLATES_ROUTE}/${uuid}/${CONTENT_ROUTE}/${REPOSITORIES_ROUTE}`,
  );
});
