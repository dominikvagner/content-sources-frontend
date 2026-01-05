import { closeGenericPopupsIfExist, waitForValidStatus } from '../UI/helpers/helpers';
import { navigateToRepositories, navigateToSnapshotsOfRepository } from '../UI/helpers/navHelpers';
import { cleanupRepositories, randomName, test, expect } from 'test-utils';
import { createCustomRepo } from '../UI/helpers/createRepositories';
import { refreshSubscriptionManager, RHSMClient, waitForRhcdActive } from './helpers/rhsmClient';
import fs from 'fs';
import { runCmd } from './helpers/helpers';

const repoNamePrefix = 'Snapshot_Config';

test.describe('Use Snapshot Config', () => {
  test('Use Snapshot Config', async ({ page, client, cleanup }) => {
    let repoName = '';
    let fileContent = '';

    const regClient = new RHSMClient(`snapshot_config_test_${randomName()}`);
    repoName = `${repoNamePrefix}_${randomName()}`;

    await test.step('Set up cleanup', async () => {
      await cleanup.runAndAdd(() => cleanupRepositories(client, repoNamePrefix));
      await cleanup.runAndAdd(() => regClient.Destroy('rhc'));
    });

    await test.step('Verify "download config file" and "copy to clipboard config" content has same value', async () => {
      await navigateToRepositories(page);
      await closeGenericPopupsIfExist(page);
      await createCustomRepo(page, repoName);
      const row = await waitForValidStatus(page, repoName, 60000);

      await navigateToSnapshotsOfRepository(page, row);

      const snapshotsModal = page.getByRole('dialog', { name: 'Snapshots' });
      await expect(snapshotsModal).toBeVisible();

      // Grant clipboard permissions to the page
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      // CLEAR the clipboard first to ensure no stale data
      await page.evaluate(() => navigator.clipboard.writeText(''));
      const snapshotsTable = snapshotsModal.getByRole('grid', { name: 'snapshot list table' });
      const firstSnapshotRow = snapshotsTable.locator('tbody tr').first();

      // Find the copy button within the first row's config column
      const copy_to_clipboard_button = firstSnapshotRow
        .getByRole('button')
        .and(firstSnapshotRow.locator('[label="repo_config_file_copy_button"]'));
      await copy_to_clipboard_button.click();

      let clipboardText = '';
      await expect
        .poll(async () => {
          clipboardText = await page.evaluate(() => navigator.clipboard.readText());
          return clipboardText;
        })
        .not.toBe('');

      // Find the download button within the first row's config column
      const download_button = firstSnapshotRow
        .getByRole('button')
        .and(firstSnapshotRow.locator('[label="repo_config_file_download_button"]'));
      const [download] = await Promise.all([
        page.waitForEvent('download'), // Wait for the download event
        download_button.click(),
      ]);
      const path = await download.path();
      if (!path) {
        throw new Error('Download failed or path is invalid');
      }
      fileContent = fs.readFileSync(path, 'utf-8').trim();
      expect(fileContent).toEqual(clipboardText.trim());

      // Add proxy configuration to the repo config for stage environment
      // The downloaded config doesn't include proxy settings, but they're needed to access content
      // remove this once HMS-9960 is fixed
      if (process.env.RH_CLIENT_PROXY) {
        console.log(`Adding proxy configuration: ${process.env.RH_CLIENT_PROXY}`);
        fileContent += `\nproxy=${process.env.RH_CLIENT_PROXY}`;
      }

      await snapshotsModal.getByRole('button', { name: 'Close', exact: true }).first().click();
    });

    await test.step('Use snapshot config', async () => {
      await regClient.Boot('rhel9');

      const reg = await regClient.RegisterRHC(process.env.ACTIVATION_KEY_1, process.env.ORG_ID_1);
      if (reg?.exitCode != 0) {
        console.log('Registration stdout:', reg?.stdout);
        console.log('Registration stderr:', reg?.stderr);
      }
      expect(reg?.exitCode, 'Registration should succeed').toBe(0);
      await waitForRhcdActive(regClient);
      await refreshSubscriptionManager(regClient);

      // add snapshot config in repos.d
      await runCmd(
        'Add user config',
        ['sh', '-c', `echo '${fileContent}' > /etc/yum.repos.d/test.repo`],
        regClient,
      );

      // verify the repo from snapshot config is listed
      const repolist = await runCmd('Verify repository is listed', ['dnf', 'repolist'], regClient);
      expect(repolist?.stdout?.toString().trim()).toContain(repoName);
      // install a package from the config
      await runCmd('Install tree package', ['yum', 'install', '-y', 'tree'], regClient, 120000);
      await runCmd('Tree package should be installed', ['rpm', '-q', 'tree'], regClient);
    });
  });
});
