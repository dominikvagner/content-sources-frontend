import { test, expect, cleanupTemplates, randomName, waitInPatch } from 'test-utils';
import {
  CONTENT_PROPAGATION_POLL,
  DNF_COMMAND_TIMEOUT_MS,
  MODAL_VISIBILITY_TIMEOUT_MS,
  RHSM_RHCD_WAIT,
  SYSTEM_ROW_VISIBILITY_TIMEOUT_MS,
  YUM_INSTALL_TIMEOUT_MS,
} from '../testConstants';
import { refreshSubscriptionManager, RHSMClient, waitForRhcdActive } from './helpers/rhsmClient';
import { runCmd } from './helpers/helpers';
import { navigateToTemplates } from '../UI/helpers/navHelpers';
import {
  closeGenericPopupsIfExist,
  getRowByNameOrUrl,
  getRowCellByHeader,
} from '../UI/helpers/helpers';

test.describe('Assign Template to System via UI', () => {
  const templateNamePrefix = 'Template_test_for_system_assignment';

  test('Create template and assign it to a system using the "Via system list" method', async ({
    page,
    client,
    cleanup,
  }) => {
    const templateName = `${templateNamePrefix}-${randomName()}`;
    const containerName = `RHSMClientTest-${randomName()}`;
    const regClient = new RHSMClient(containerName);
    let hostname = '';

    await test.step('Boot and register RHSM client', async () => {
      await regClient.Boot('rhel9');
      hostname = await regClient.GetHostname();
      console.log('Container hostname:', hostname);

      const reg = await regClient.RegisterRHC(process.env.ACTIVATION_KEY_1, process.env.ORG_ID_1);
      if (reg?.exitCode != 0) {
        console.log('Registration stdout:', reg?.stdout);
        console.log('Registration stderr:', reg?.stderr);
      }
      expect(reg?.exitCode, 'Expect registering to be successful').toBe(0);

      await waitForRhcdActive(regClient, RHSM_RHCD_WAIT.maxAttempts, RHSM_RHCD_WAIT.delayMs);
      await waitInPatch(page, hostname, false);

      const packageUrl = await runCmd(
        'Get download URL for vim-enhanced from base CDN',
        ['dnf', 'repoquery', '--quiet', '--location', 'vim-enhanced'],
        regClient,
        DNF_COMMAND_TIMEOUT_MS,
      );
      const baseCdnOutput = [packageUrl?.stdout, packageUrl?.stderr].filter(Boolean).join('\n');
      console.log('Package download URL from base CDN:', baseCdnOutput);
      expect(
        baseCdnOutput,
        'Package download URL should be from base CDN, not template',
      ).not.toContain('/templates/');
    });

    await test.step('Create template', async () => {
      await cleanup.runAndAdd(() => cleanupTemplates(client, templateNamePrefix));
      cleanup.add(() => regClient.Destroy('rhc'));

      await closeGenericPopupsIfExist(page);
      await navigateToTemplates(page);

      const nextButton = page.getByRole('button', { name: 'Next', exact: true });

      await page.getByRole('button', { name: 'Create template' }).click();
      await page.getByRole('button', { name: 'filter OS version' }).click();
      await page.getByRole('menuitem', { name: 'RHEL 9' }).click();
      await page.getByRole('button', { name: 'filter architecture' }).click();
      await page.getByRole('menuitem', { name: 'x86_64' }).click();
      await nextButton.click();

      await expect(
        page.getByRole('heading', { name: 'Additional Red Hat repositories', exact: true }),
      ).toBeVisible();
      await nextButton.click();

      await expect(
        page.getByRole('heading', { name: 'Other repositories', exact: true }),
      ).toBeVisible();
      await nextButton.click();

      await page.getByRole('radio', { name: 'Use the latest content' }).check();
      await nextButton.click();

      await expect(page.getByText('Enter template details')).toBeVisible();
      await page.getByPlaceholder('Enter name').fill(templateName);
      await page.getByPlaceholder('Description').fill('Test template for system assignment');
      await nextButton.click();

      await page.getByRole('button', { name: 'Create template and add to systems' }).click();
    });

    await test.step('Assign template to systems', async () => {
      const modalPage = page.getByRole('dialog', { name: 'Assign template to systems' });
      await expect(modalPage).toBeVisible({ timeout: MODAL_VISIBILITY_TIMEOUT_MS });

      await expect(modalPage.getByRole('button', { name: 'Save', exact: true })).toBeDisabled({
        timeout: MODAL_VISIBILITY_TIMEOUT_MS,
      });

      const rowSystem = await getRowByNameOrUrl(modalPage, hostname);
      await rowSystem.getByRole('checkbox').check();

      await modalPage.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(modalPage).toBeHidden({ timeout: MODAL_VISIBILITY_TIMEOUT_MS });

      const systemRow = await getRowByNameOrUrl(page, hostname);
      await expect(systemRow).toBeVisible({ timeout: SYSTEM_ROW_VISIBILITY_TIMEOUT_MS });
    });

    await test.step('Check template table systems column, expect a system assigned', async () => {
      await navigateToTemplates(page);
      const row = await getRowByNameOrUrl(page, templateName);
      const cell = await getRowCellByHeader(page, row, 'Systems');
      const systemsButton = cell.getByRole('button');
      await expect(systemsButton).toHaveText('1');

      await systemsButton.click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(templateName);
    });

    await test.step('Verify the host can install packages from the template', async () => {
      await refreshSubscriptionManager(regClient);
      await runCmd('Clean cached metadata', ['dnf', 'clean', 'all'], regClient);

      await runCmd(
        'vim-enhanced should not be installed',
        ['rpm', '-q', 'vim-enhanced'],
        regClient,
        DNF_COMMAND_TIMEOUT_MS,
        1,
      );

      // Poll for template URL (content propagation can be slow in CI)
      await expect
        .poll(
          async () => {
            const res = await regClient.Exec(
              ['dnf', 'repoquery', '--quiet', '--location', 'vim-enhanced'],
              DNF_COMMAND_TIMEOUT_MS,
            );
            const output = [res?.stdout, res?.stderr].filter(Boolean).join('\n');
            console.log('Package download URL from template:', output);
            return output;
          },
          {
            timeout: CONTENT_PROPAGATION_POLL.timeout,
            intervals: [...CONTENT_PROPAGATION_POLL.intervals],
          },
        )
        .toContain('/templates/');

      await runCmd(
        'Install vim-enhanced',
        ['yum', 'install', '-y', 'vim-enhanced'],
        regClient,
        YUM_INSTALL_TIMEOUT_MS,
      );

      await runCmd('vim-enhanced should be installed', ['rpm', '-q', 'vim-enhanced'], regClient);
    });
  });
});
