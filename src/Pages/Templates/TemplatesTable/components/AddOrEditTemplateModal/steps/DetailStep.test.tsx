import { render } from '@testing-library/react';
import { useAddOrEditTemplateContext } from '../AddOrEditTemplateContext';
import { defaultTemplateItem } from 'testingHelpers';
import { TEMPLATE_NAME_TAKEN_MESSAGE } from '../../../helpers';
import DetailStep from './DetailStep';

jest.mock('../AddOrEditTemplateContext', () => ({
  useAddOrEditTemplateContext: jest.fn(),
}));

const defaultContext = {
  templateRequest: defaultTemplateItem,
  setTemplateRequest: () => undefined,
  isNameTaken: false,
  isNameCheckPending: false,
};

it('expect DetailStep to render correctly', () => {
  (useAddOrEditTemplateContext as jest.Mock).mockImplementation(() => defaultContext);

  const { getByPlaceholderText } = render(<DetailStep />);

  expect(getByPlaceholderText('Enter name')).toHaveAttribute('value', defaultTemplateItem.name);
  expect(getByPlaceholderText('Enter description')).toHaveTextContent(
    defaultTemplateItem.description,
  );
});

it('shows duplicate name error when name is taken', () => {
  (useAddOrEditTemplateContext as jest.Mock).mockImplementation(() => ({
    ...defaultContext,
    isNameTaken: true,
  }));

  const { getByText } = render(<DetailStep />);

  expect(getByText(TEMPLATE_NAME_TAKEN_MESSAGE)).toBeInTheDocument();
});
