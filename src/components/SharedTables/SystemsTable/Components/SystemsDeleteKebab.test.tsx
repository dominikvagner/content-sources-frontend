import { render, screen } from '@testing-library/react';
import SystemsDeleteKebab from './SystemsDeleteKebab';
import userEvent from '@testing-library/user-event';
import { defaultSystemsListItem } from 'testingHelpers';
import { TEMPLATE_SYSTEMS_UPDATE_LIMIT } from 'Pages/Templates/TemplatesTable/constants';

jest.mock('middleware/AppContext', () => ({
  useAppContext: () => ({ rbac: { templateWrite: true } }),
}));

it('renders with no checked systems', async () => {
  const selected = [];

  render(
    <SystemsDeleteKebab
      selected={selected}
      deselectAll={jest.fn()}
      deleteFromSystems={jest.fn()}
      isDisabled={selected.length > TEMPLATE_SYSTEMS_UPDATE_LIMIT}
    />,
  );

  const kebab = screen.getByRole('button', { name: 'plain kebab' });
  await userEvent.click(kebab);
  const deleteButton = screen.getByRole('menuitem', {
    name: `Unassign template from ${selected.length} system(s)`,
  });
  expect(deleteButton).toBeDisabled();
});

it('renders with checked systems', async () => {
  const selected = [defaultSystemsListItem.id];

  render(
    <SystemsDeleteKebab
      selected={selected}
      deselectAll={jest.fn()}
      deleteFromSystems={jest.fn()}
      isDisabled={selected.length > TEMPLATE_SYSTEMS_UPDATE_LIMIT}
    />,
  );

  const kebab = screen.getByRole('button', { name: 'plain kebab' });
  await userEvent.click(kebab);
  const deleteButton = screen.getByRole('menuitem', {
    name: `Unassign template from ${selected.length} system(s)`,
  });
  expect(deleteButton).toBeEnabled();
});

it('prevents unassigning a template when more than 1000 systems are selected', async () => {
  const selected = Array.from(
    { length: TEMPLATE_SYSTEMS_UPDATE_LIMIT + 1 },
    (_, index) => `system-${index}`,
  );

  render(
    <SystemsDeleteKebab
      selected={selected}
      deselectAll={jest.fn()}
      deleteFromSystems={jest.fn()}
      isDisabled={selected.length > TEMPLATE_SYSTEMS_UPDATE_LIMIT}
    />,
  );

  const kebab = screen.getByRole('button', { name: 'plain kebab' });
  expect(kebab).toBeDisabled();
});
