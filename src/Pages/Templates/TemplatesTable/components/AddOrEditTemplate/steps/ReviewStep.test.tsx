import { render } from '@testing-library/react';
import { useAddOrEditTemplateContext } from '../AddOrEditTemplateContext';
import { defaultTemplateItem, testRepositoryParamsResponse } from 'testingHelpers';
import ReviewStep from './ReviewStep';
import { formatDateDDMMMYYYY } from 'helpers';

jest.mock('../AddOrEditTemplateContext', () => ({
  useAddOrEditTemplateContext: jest.fn(),
}));

it('expect Review step to render correctly', () => {
  (useAddOrEditTemplateContext as jest.Mock).mockImplementation(() => ({
    templateRequest: defaultTemplateItem,
    selectedRedhatRepos: new Set(['item1', 'item2']),
    selectedCustomRepos: new Set(['item1']),
    hardcodedRedhatRepositoryUUIDS: new Set('item1'),
    distribution_arches: testRepositoryParamsResponse.distribution_arches,
    distribution_versions: testRepositoryParamsResponse.distribution_versions,
    extended_release_features: testRepositoryParamsResponse.extended_release_features,
    distribution_minor_versions: testRepositoryParamsResponse.distribution_minor_versions,
    isEdit: false,
  }));

  const { getByText } = render(<ReviewStep />);

  expect(getByText('Create')).toBeInTheDocument();
  expect(getByText(defaultTemplateItem.arch)).toBeInTheDocument();
  expect(getByText('el' + defaultTemplateItem.version)).toBeInTheDocument();
  expect(getByText(formatDateDDMMMYYYY(defaultTemplateItem.date))).toBeInTheDocument();
  expect(getByText(defaultTemplateItem.name)).toBeInTheDocument();
});
