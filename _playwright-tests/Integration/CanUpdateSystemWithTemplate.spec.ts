import {
  test,
  expect,
  cleanupTemplates,
  randomName,
  TemplatesApi,
  ListTemplatesRequest,
  ensureValidToken,
} from 'test-utils';
import {
  DNF_UPDATEINFO_TIMEOUT_MS,
  ERRATA_POLL,
  LONG_TEST_TIMEOUT_MS,
  TEMPLATE_UPDATE_TASK_POLL,
  TEMPLATE_VALID_STATUS_TIMEOUT_MS,
  YUM_INSTALL_QUICK_TIMEOUT_MS,
  YUM_INSTALL_TIMEOUT_MS,
} from '../testConstants';
import { RHSMClient, refreshSubscriptionManager, waitForRhcdActive } from './helpers/rhsmClient';
import { runCmd } from './helpers/helpers';
import { navigateToTemplates } from '../UI/helpers/navHelpers';
import {
  closeGenericPopupsIfExist,
  getRowByNameOrUrl,
  waitForValidStatus,
} from '../UI/helpers/helpers';

const templateNamePrefix = 'integration_test_template';
const templateName = `${templateNamePrefix}-${randomName()}`;
const regClient = new RHSMClient(`RHSMClientTest-${randomName()}`);

let firstCountNumber: number;

test.describe('Test System With Template', () => {
  test.use({
    storageState: '.auth/LAYERED_REPO_TOKEN.json',
    extraHTTPHeaders: process.env.LAYERED_REPO_TOKEN
      ? { Authorization: process.env.LAYERED_REPO_TOKEN }
      : {},
  });

  test('Verify system updates with template', async ({ page, client, cleanup }) => {
    // Increase timeout for CI environment because template update tasks can take longer
    test.setTimeout(LONG_TEST_TIMEOUT_MS);

    const HARepo = 'Red Hat Enterprise Linux 9 for x86_64 - High Availability';

    await test.step('Add cleanup, delete any templates and template test repos that exist', async () => {
      await cleanup.runAndAdd(() => cleanupTemplates(client, templateNamePrefix));
      cleanup.add(() => regClient.Destroy('rhc'));
    });

    await test.step('Navigate to templates', async () => {
      await navigateToTemplates(page);
      await closeGenericPopupsIfExist(page);
    });

    await test.step('Create a template with oldest snapshots', async () => {
      await page.getByRole('button', { name: 'Create template' }).click();
      await page.getByRole('button', { name: 'filter OS version' }).click();
      await page.getByRole('menuitem', { name: 'RHEL 9' }).click();
      await page.getByRole('button', { name: 'filter architecture' }).click();
      await page.getByRole('menuitem', { name: 'x86_64' }).click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Additional Red Hat repositories', exact: true }),
      ).toBeVisible();
      const modalPage = page.getByTestId('add_template_modal');
      const rowHARepo = await getRowByNameOrUrl(modalPage, HARepo);
      await rowHARepo.getByLabel('Select row').click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Other repositories', exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.getByText('Use up to a specific date', { exact: true }).click();
      await page.getByPlaceholder('YYYY-MM-DD', { exact: true }).fill('2021-05-17'); // Older than any snapshot date
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(page.getByText('Enter template details')).toBeVisible();
      await page.getByPlaceholder('Enter name').fill(`${templateName}`);
      await page.getByPlaceholder('Description').fill('Template test');
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.getByRole('button', { name: 'Create other options' }).click();
      await page.getByText('Create template only', { exact: true }).click();
      await waitForValidStatus(page, templateName, TEMPLATE_VALID_STATUS_TIMEOUT_MS);
    });

    await test.step('Create RHSM client and register the template', async () => {
      // Start the rhel9 container
      await regClient.Boot('rhel9');

      // Register, overriding the default key and org
      const reg = await regClient.RegisterRHC(
        process.env.LAYERED_REPO_ACCESS_ACTIVATION_KEY,
        process.env.LAYERED_REPO_ACCESS_ORG_ID,
        templateName,
      );
      if (reg?.exitCode != 0) {
        console.log(reg?.stdout);
        console.log(reg?.stderr);
      }
      expect(reg?.exitCode, 'Expect registering to be successful').toBe(0);

      await waitForRhcdActive(regClient);

      await refreshSubscriptionManager(regClient);

      await runCmd('Clean cached metadata', ['dnf', 'clean', 'all'], regClient);

      const count = await runCmd(
        'List available packages',
        ['sh', '-c', 'dnf updateinfo --list --all | grep RH | wc -l'],
        regClient,
        DNF_UPDATEINFO_TIMEOUT_MS,
      );
      const raw = count?.stdout?.toString().trim() ?? '0';
      firstCountNumber = Number.parseInt(raw, 10);
      if (Number.isNaN(firstCountNumber)) firstCountNumber = 0;
    });

    await test.step('Update the template date to latest', async () => {
      const rowTemplate = await getRowByNameOrUrl(page, templateName);
      await rowTemplate.getByRole('button', { name: templateName }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(templateName);
      await page.getByRole('button', { name: 'Actions' }).click();
      await page.getByRole('menuitem', { name: 'Edit' }).click();
      await expect(
        page.getByRole('heading', { name: 'OS and architecture', exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Additional Red Hat repositories', exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Other repositories', exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.getByText('Use the latest content', { exact: true }).click();
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(page.getByText('Enter template details')).toBeVisible();
      await expect(page.getByPlaceholder('Enter name')).toHaveValue(`${templateName}`);
      await expect(page.getByPlaceholder('Description')).toHaveValue('Template test');
      await page.getByPlaceholder('Description').fill('Template test edited');
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await page.getByRole('button', { name: 'Confirm changes', exact: true }).click();

      await expect
        .poll(
          async () => {
            await ensureValidToken(page, `LAYERED_REPO_TOKEN.json`, 5);
            const templates = await new TemplatesApi(client).listTemplates(<ListTemplatesRequest>{
              name: templateName,
            });
            const template = templates.data?.[0];
            const taskStatus = template?.lastUpdateTask?.status;
            const taskError = template?.lastUpdateTask?.error;

            // Log task status for debugging
            if (taskStatus) {
              console.log(`Template update task status: ${taskStatus}`);
              if (taskError) {
                console.log(`Template update task error: ${taskError}`);
              }
            }

            return taskStatus;
          },
          {
            message: 'Wait for template update task to complete',
            timeout: TEMPLATE_UPDATE_TASK_POLL.timeout,
            intervals: [...TEMPLATE_UPDATE_TASK_POLL.intervals],
          },
        )
        .toBe('completed');
    });

    await test.step('Install from the updated template', async () => {
      // Refresh subscription manager so the client picks up the updated template content
      await refreshSubscriptionManager(regClient);

      // Poll for errata count to increase (allows time for content propagation in CI)
      await expect
        .poll(
          async () => {
            await regClient.Exec(['dnf', 'clean', 'all']);
            const result = await regClient.Exec(
              ['sh', '-c', 'dnf updateinfo --list --all | grep RH | wc -l'],
              ERRATA_POLL.dnfTimeout,
            );
            const raw = result?.stdout?.toString().trim() ?? '0';
            const count = Number.parseInt(raw, 10);
            return Number.isNaN(count) ? 0 : count;
          },
          {
            message: 'Expect that there are more erratas after template update',
            timeout: ERRATA_POLL.timeout,
            intervals: [...ERRATA_POLL.intervals],
          },
        )
        .toBeGreaterThan(firstCountNumber);

      await runCmd(
        'vim-enhanced should not be installed',
        ['rpm', '-q', 'vim-enhanced'],
        regClient,
        YUM_INSTALL_QUICK_TIMEOUT_MS,
        1,
      );

      await runCmd(
        'Install vim-enhanced',
        ['yum', 'install', '-y', 'vim-enhanced'],
        regClient,
        YUM_INSTALL_QUICK_TIMEOUT_MS,
      );

      await runCmd('vim-enhanced should be installed', ['rpm', '-q', 'vim-enhanced'], regClient);

      // booth is small but the transaction pulls many HA deps (~119 packages, ~24 MiB download).
      await runCmd(
        'Install booth from the HA layered repo',
        ['yum', 'install', '-y', 'booth'],
        regClient,
        YUM_INSTALL_TIMEOUT_MS,
      );

      await runCmd('booth should be installed', ['rpm', '-q', 'booth'], regClient);

      const dnfVerifyRepo = await runCmd(
        'Verify that booth was installed from the HA repo',
        ['sh', '-c', "dnf info booth | grep '^From repo' | cut -d ':' -f2-"],
        regClient,
        YUM_INSTALL_QUICK_TIMEOUT_MS,
      );
      expect(dnfVerifyRepo?.stdout?.toString().trim()).toBe(
        'rhel-9-for-x86_64-highavailability-rpms',
      );
    });
  });
});
