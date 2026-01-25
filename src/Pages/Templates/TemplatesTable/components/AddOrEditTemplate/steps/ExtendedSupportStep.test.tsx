import {
  defaultTemplateItem,
  testRepositoryParamsResponse,
} from '../../../../../../testingHelpers';
import { useAddOrEditTemplateContext } from '../AddOrEditTemplateContext';
import ExtendedSupportStep from './ExtendedSupportStep';
import { render } from '@testing-library/react';

jest.mock('../AddOrEditTemplateContext', () => ({
  useAddOrEditTemplateContext: jest.fn(),
}));

const defaultMockContext = {
  isEdit: false,
  templateRequest: defaultTemplateItem,
  setTemplateRequest: () => undefined,
  distribution_arches: testRepositoryParamsResponse.distribution_arches,
  distribution_versions: testRepositoryParamsResponse.distribution_versions,
  extended_release_features: testRepositoryParamsResponse.extended_release_features,
  distribution_minor_versions: testRepositoryParamsResponse.distribution_minor_versions,
};

beforeEach(() => {
  (useAddOrEditTemplateContext as jest.Mock).mockImplementation(() => defaultMockContext);
});

it('expect ExtendedSupportStep to render correct initial state', () => {
  const { getByRole, queryByRole } = render(<ExtendedSupportStep />);

  const heading = getByRole('heading', { name: 'Content versioning', level: 1 });
  expect(heading).toBeInTheDocument();

  const radio = getByRole('radio', { name: 'Latest release' });
  expect(radio).toBeChecked();

  const updateStreamToggle = queryByRole('button', { name: 'Update stream toggle' });
  expect(updateStreamToggle).not.toBeInTheDocument();

  const minorVersionToggle = queryByRole('button', { name: 'Minor version toggle' });
  expect(minorVersionToggle).not.toBeInTheDocument();
});
