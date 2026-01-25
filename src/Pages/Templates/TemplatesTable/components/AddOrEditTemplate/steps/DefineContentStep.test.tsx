import { render } from '@testing-library/react';
import { useAddOrEditTemplateContext } from '../AddOrEditTemplateContext';
import { defaultTemplateItem, testRepositoryParamsResponse } from 'testingHelpers';
import DefineContentStep from './DefineContentStep';

jest.mock('../AddOrEditTemplateContext', () => ({
  useAddOrEditTemplateContext: jest.fn(),
}));

it('expect DefineContentStep to render correctly', () => {
  (useAddOrEditTemplateContext as jest.Mock).mockImplementation(() => ({
    isEdit: false,
    templateRequest: defaultTemplateItem,
    setTemplateRequest: () => undefined,
    distribution_arches: testRepositoryParamsResponse.distribution_arches,
    distribution_versions: testRepositoryParamsResponse.distribution_versions,
    extended_release_features: testRepositoryParamsResponse.extended_release_features,
    distribution_minor_versions: testRepositoryParamsResponse.distribution_minor_versions,
  }));

  const { getByText } = render(<DefineContentStep />);

  const archTextBox = getByText(defaultTemplateItem.arch);

  expect(archTextBox).toBeInTheDocument();
  expect(archTextBox).not.toHaveAttribute('disabled');

  const versionTextBox = getByText('el' + defaultTemplateItem.version);

  expect(versionTextBox).toBeInTheDocument();
  expect(versionTextBox).not.toHaveAttribute('disabled');
});

it('expect DefineContentStep to render with disabled inputs', () => {
  (useAddOrEditTemplateContext as jest.Mock).mockImplementation(() => ({
    isEdit: true,
    templateRequest: defaultTemplateItem,
    setTemplateRequest: () => undefined,
    distribution_arches: testRepositoryParamsResponse.distribution_arches,
    distribution_versions: testRepositoryParamsResponse.distribution_versions,
    extended_release_features: testRepositoryParamsResponse.extended_release_features,
    distribution_minor_versions: testRepositoryParamsResponse.distribution_minor_versions,
  }));

  const { getByTestId } = render(<DefineContentStep />);

  const archTextBox = getByTestId('restrict_to_architecture');

  expect(archTextBox).toBeInTheDocument();
  expect(archTextBox).toHaveAttribute('disabled');

  const versionTextBox = getByTestId('restrict_to_os_version');

  expect(versionTextBox).toBeInTheDocument();
  expect(versionTextBox).toHaveAttribute('disabled');
});
