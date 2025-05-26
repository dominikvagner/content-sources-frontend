import { expect, test } from '@playwright/test';
import { navigateToRepositories } from './helpers/navHelpers';
import { randomName, randomUrl } from './helpers/repoHelpers';
import { closePopupsIfExist, getRowByNameOrUrl } from './helpers/helpers';
import { deleteAllRepos } from './helpers/deleteRepositories';
import { getUserAuthToken } from '../helpers/loginHelpers';

const repoNamePrefix = 'Repo-RBAC';
const repoName = `${repoNamePrefix}-${randomName()}`;
const url = randomUrl();

test.describe('Combined user tests', () => {
  test.use({ storageState: '.auth/user.json' });

  test('Create a repo as admin', async ({ page }) => {
    await test.step('Navigate to the repository page', async () => {
      // Clean up the repo name file
      await deleteAllRepos(page, `&search=${repoNamePrefix}`);
      await navigateToRepositories(page);
      await closePopupsIfExist(page);
    });

    await test.step('Create a repository', async () => {
      await page.getByRole('button', { name: 'Add repositories' }).first().click();
      await expect(page.getByRole('dialog', { name: 'Add custom repositories' })).toBeVisible();

      await page.getByLabel('Name').fill(repoName);
      await page.getByLabel('Introspect only').click();
      await page.getByLabel('URL').fill(url);
      await page.getByRole('button', { name: 'Save', exact: true }).click();
    });

    await test.step('Read the repo', async () => {
      const row = await getRowByNameOrUrl(page, repoName);
      await expect(row.getByText('Valid')).toBeVisible();
      await row.getByLabel('Kebab toggle').click();
      await row.getByRole('menuitem', { name: 'Edit' }).click();
      await expect(page.getByRole('dialog', { name: 'Edit custom repository' })).toBeVisible();
      await expect(page.getByPlaceholder('Enter name', { exact: true })).toHaveValue(repoName);
      await expect(page.getByPlaceholder('https://', { exact: true })).toHaveValue(url);
    });

    await test.step('Update the repository', async () => {
      await page.getByPlaceholder('Enter name', { exact: true }).fill(`${repoName}-Edited`);
      await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    });
  });

  test.describe('Read Only User', () => {
    test.use({
      storageState: '.auth/read-only.json',
      extraHTTPHeaders: { Authorization: getUserAuthToken('read-only') },
    });

    test(`Verify that read only user can't edit`, async ({ page }) => {
      await test.step('Navigate to the repository page', async () => {
        await navigateToRepositories(page);
        await closePopupsIfExist(page);
      });

      await test.step('Read the repo and check edit is disabled', async () => {
        const row = await getRowByNameOrUrl(page, `${repoName}-Edited`);
        await expect(row.getByText('Valid')).toBeVisible({ timeout: 60000 });
        await row.getByLabel('Kebab toggle').click();
        await expect(row.getByRole('menuitem', { name: 'Edit' })).not.toBeVisible();
      });
    });
  });
});
