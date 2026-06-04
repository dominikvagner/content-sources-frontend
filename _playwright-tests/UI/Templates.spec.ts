import { test, expect, cleanupRepositories, cleanupTemplates, randomName } from 'test-utils';
import { navigateToRepositories, navigateToTemplates } from './helpers/navHelpers';
import {
  closeGenericPopupsIfExist,
  getRowByNameOrUrl,
  waitForValidStatus,
} from './helpers/helpers';
import { createCustomRepo } from './helpers/createRepositories';

test.describe('Templates', () => {
  test('Navigate to templates, make sure the Create template button can be clicked', async ({
    page,
  }) => {
    await navigateToTemplates(page);
    await closeGenericPopupsIfExist(page);

    const AddButton = page.locator('[data-ouia-component-id="create_content_template"]');

    await expect(AddButton.first()).toBeEnabled({ timeout: 10000 });
  });

  test('Validate documentation link in empty state', async ({ page, context }) => {
    await test.step('Mock template list API to get to empty state', async () => {
      await page.route('**/api/content-sources/*/templates/**', async (route) => {
        const response = await route.fetch();
        const json = {
          data: [],
          links: {
            first: '/api/content-sources/v1.0/templates/?limit=20&offset=0',
            last: '/api/content-sources/v1.0/templates/?limit=20&offset=0',
          },
          meta: { count: 0, limit: 20, offset: 0 },
        };
        await route.fulfill({ response, json });
      });
    });

    await test.step('Navigate to the templates page', async () => {
      await navigateToTemplates(page);
      await closeGenericPopupsIfExist(page);
    });

    await test.step(`Click the 'Learn more about content templates' link and verify the destination`, async () => {
      // Start waiting for the docs page before clicking
      const pagePromise = context.waitForEvent('page');

      await page.getByRole('link', { name: 'Learn more about content templates' }).click();
      const docsPage = await pagePromise;
      await expect(docsPage).toHaveURL(
        /^https:\/\/docs\.redhat\.com\/en\/documentation\/red_hat_lightspeed\/.*using-content-templates-to-apply-system-patches.*$/,
      );
      await expect(docsPage.getByText(/^.*Using content templates.*$/).first()).toBeVisible();
      await expect(
        docsPage.getByText('A content template is a set of repository snapshots').first(),
      ).toBeVisible();
    });
  });

  test('Copying templates', async ({ page, client, cleanup, unusedRepoUrl }) => {
    const smallRHRepo = 'Red Hat CodeReady Linux Builder for RHEL 9 ARM 64 (RPMs)';

    const repoNamePrefix = 'copy-template-custom-repo';
    const repoName = `${repoNamePrefix}-${randomName()}`;
    const templateNamePrefix = 'copy-template-test';
    const templateName = `${templateNamePrefix}-${randomName()}`;
    const templateDescription = 'To be copied..';
    const copyName = `copied-template-${randomName()}`;

    await test.step('Pre-test setup', async () => {
      await cleanup.runAndAdd(() => cleanupRepositories(client, repoNamePrefix));
      await cleanup.runAndAdd(() => cleanupTemplates(client, templateName));
      await cleanup.runAndAdd(() => cleanupTemplates(client, copyName));
    });

    await test.step('Create testing repo', async () => {
      await navigateToRepositories(page);
      await closeGenericPopupsIfExist(page);

      await createCustomRepo(page, repoName, unusedRepoUrl);
      await waitForValidStatus(page, repoName);
    });

    await test.step('Navigate to the templates page', async () => {
      await navigateToTemplates(page);
      await closeGenericPopupsIfExist(page);
    });

    await test.step('Create a template', async () => {
      await page.getByRole('button', { name: 'Create template' }).click();
      await page.getByRole('button', { name: 'filter OS version' }).click();
      await page.getByRole('menuitem', { name: 'RHEL 9' }).click();
      await page.getByRole('button', { name: 'filter architecture' }).click();
      await page.getByRole('menuitem', { name: 'aarch64' }).click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();

      const modalPage = page.getByTestId('add_template_modal');
      const rowRHELRepo = await getRowByNameOrUrl(modalPage, smallRHRepo);
      await rowRHELRepo.getByLabel('Select row').click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();

      const rowRepo = await getRowByNameOrUrl(modalPage, repoName);
      await rowRepo.getByLabel('Select row').click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();

      await page.getByText('Use the latest content', { exact: true }).click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();

      await expect(page.getByText('Enter template details')).toBeVisible();
      await page.getByPlaceholder('Enter name').fill(templateName);
      await page.getByPlaceholder('Enter name').press('Enter');
      await page.getByPlaceholder('Description').fill(templateDescription);
      await page.getByRole('button', { name: 'Next', exact: true }).click();

      await page.getByRole('button', { name: 'Create other options' }).click();
      await page.getByText('Create template only', { exact: true }).click();

      await waitForValidStatus(page, templateName);
    });

    await test.step('Copy the created template, verify the modal is correctly pre-filled', async () => {
      const rowTemplate = await waitForValidStatus(page, templateName);
      await rowTemplate.getByLabel('Kebab toggle').click();
      await page.getByRole('menuitem', { name: 'Copy' }).click();

      const modal = page.getByTestId('add_template_modal');
      await expect(modal).toBeVisible();
      await expect(modal.getByText('Enter template details')).toBeVisible();
      await expect(modal.getByText('A template with this name already exists.')).toBeVisible();

      await modal.getByRole('button', { name: 'Content', exact: true }).click();
      await modal.getByRole('button', { name: 'OS and architecture', exact: true }).click();

      await expect(modal.getByText('RHEL 9')).toBeVisible();
      await expect(modal.getByText('aarch64')).toBeVisible();
      await modal.getByRole('button', { name: 'Next', exact: true }).click();

      const rowRHELRepo = await getRowByNameOrUrl(modal, smallRHRepo);
      await expect(rowRHELRepo.getByLabel('Select row')).toBeChecked();
      await modal.getByRole('button', { name: 'Next', exact: true }).click();

      const rowRepo = await getRowByNameOrUrl(modal, repoName);
      await expect(rowRepo.getByLabel('Select row')).toBeChecked();
      await modal.getByRole('button', { name: 'Next', exact: true }).click();

      await expect(modal.getByLabel('Use the latest content')).toBeChecked();
      await modal.getByRole('button', { name: 'Next', exact: true }).click();

      await modal.getByPlaceholder('Enter name').fill(copyName);
      await expect(modal.getByText('A template with this name already exists.')).toBeHidden();
      await expect(modal.getByText(templateDescription)).toBeVisible();
      await page.getByRole('button', { name: 'Next', exact: true }).click();

      await page.getByRole('button', { name: 'Create other options' }).click();
      await page.getByText('Create template only', { exact: true }).click();

      await waitForValidStatus(page, copyName);
    });
  });
});
