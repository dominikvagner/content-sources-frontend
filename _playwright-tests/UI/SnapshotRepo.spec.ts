import { test, expect } from 'test-utils';
import { cleanupRepositories } from 'test-utils/helpers';
import { navigateToRepositories } from './helpers/navHelpers';
import {
  closePopupsIfExist,
  getRowByNameOrUrl,
  validateSnapshotTimestamp,
} from './helpers/helpers';

const repoName = 'one';
const repoUrl = 'https://jlsherrill.fedorapeople.org/fake-repos/revision/' + repoName;

test.describe('Snapshot Repositories', () => {
  test('Snapshot a repository', async ({ page, client, cleanup }) => {
    await cleanup.runAndAdd(() => cleanupRepositories(client, repoName, repoUrl));
    await navigateToRepositories(page);
    await closePopupsIfExist(page);

    await test.step('Open the add repository modal', async () => {
      await page.getByRole('button', { name: 'Add repositories' }).first().click();
      await expect(page.getByRole('dialog', { name: 'Add custom repositories' })).toBeVisible();
    });

    await test.step('Fill in the repository details', async () => {
      await page.getByLabel('Name').fill(repoName);
      await page.getByLabel('URL').fill(repoUrl);
    });

    await test.step('Filter by architecture', async () => {
      await page.getByRole('button', { name: 'filter architecture' }).click();
      await page.getByRole('option', { name: 'x86_64' }).click();
    });

    await test.step('Filter by version', async () => {
      const versionFilterButton = page.getByRole('button', { name: 'filter version' });
      await versionFilterButton.click();
      await page.getByRole('menuitem', { name: 'el9' }).locator('label').click();
      await page.getByRole('menuitem', { name: 'el8' }).locator('label').click();
      await versionFilterButton.click(); // Close the version filter dropdown
    });

    await test.step('Submit the form and wait for modal to disappear', async () => {
      await Promise.all([
        // Click on 'Save'
        page.getByRole('button', { name: 'Save' }).first().click(),
        page.waitForResponse(
          (resp) =>
            resp.url().includes('/bulk_create/') && resp.status() >= 200 && resp.status() < 300,
        ),
        expect(page.getByRole('dialog', { name: 'Add custom repositories' })).not.toBeVisible(),
      ]);
    });

    await test.step('Verify that snapshot is successful', async () => {
      const row = await getRowByNameOrUrl(page, repoName);
      await expect(row.getByText('Valid')).toBeVisible({ timeout: 60000 });
    });

    await test.step('Verify that snapshot is in snapshots list', async () => {
      const row = await getRowByNameOrUrl(page, repoName);
      await row.getByLabel('Kebab toggle').click();
      await page.getByRole('menuitem', { name: 'View all snapshots' }).click();
      await expect(page.getByLabel('SnapshotsView list of').locator('tbody')).toBeVisible();
      const snapshotTimestamp = await page
        .getByLabel('SnapshotsView list of')
        .locator('tbody')
        .textContent();
      if (snapshotTimestamp != null) {
        if ((await validateSnapshotTimestamp(snapshotTimestamp, 10)) == false) {
          throw new Error('Most recent snapshot timestamp is older than 10 minutes!');
        }
      } else {
        throw new Error('Snapshot timestamp not found!');
      }
      await page.getByLabel('Close', { exact: true }).click();
    });

    await test.step('Delete created repository', async () => {
      const row = await getRowByNameOrUrl(page, repoUrl);
      await row.getByLabel('Kebab toggle').click();
      await row.getByRole('menuitem', { name: 'Delete' }).click();
      await expect(page.getByText('Remove repositories?')).toBeVisible();

      await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes('bulk_delete') && resp.status() >= 200 && resp.status() < 300,
        ),
        page.getByRole('button', { name: 'Remove' }).click(),
      ]);

      await expect(row).not.toBeVisible();
    });
  });
});
