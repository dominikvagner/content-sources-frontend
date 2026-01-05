import { test, expect, cleanupTemplates, randomName } from 'test-utils';
import { navigateToTemplates } from '../UI/helpers/navHelpers';
import { closeGenericPopupsIfExist, waitForValidStatus } from '../UI/helpers/helpers';
import { RHSMClient, waitForRhcdActive, refreshSubscriptionManager } from './helpers/rhsmClient';
import { pollForSystemTemplateAttachment } from './helpers/systemHelpers';

const templateNamePrefix = 'use_template_dialog_test';
const regClient = new RHSMClient(`RHSMClientTest-${randomName()}`);

test.describe('Register and assign template to systems via API', () => {
  test('Create template and assign to systems via API', async ({ page, client, cleanup }) => {
    const templateName = `${templateNamePrefix}-${randomName()}`;

    await test.step('Set up cleanup for repositories, templates, and RHSM client', async () => {
      await cleanup.runAndAdd(() => cleanupTemplates(client, templateNamePrefix));
      cleanup.add(() => regClient.Destroy('rhc'));
    });

    await closeGenericPopupsIfExist(page);

    await test.step('Create template via UI', async () => {
      await navigateToTemplates(page);
      page.getByRole('button', { name: 'Create template' }).click();

      await page.getByRole('button', { name: 'filter architecture' }).click();
      await page.getByRole('menuitem', { name: 'x86_64' }).click();
      await page.getByRole('button', { name: 'filter OS version' }).click();
      await page.getByRole('menuitem', { name: 'el9' }).click();
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
      await page.getByPlaceholder('Enter name').fill(templateName);
      await page.getByPlaceholder('Description').fill('Template for use template dialog test');
      await page.getByRole('button', { name: 'Next', exact: true }).click();

      await page.getByRole('button', { name: 'Create other options' }).click();
      await page.getByText('Create template only', { exact: true }).click();

      await waitForValidStatus(page, templateName);
    });

    const modalPage = page.getByRole('dialog').filter({ hasText: 'Assign template to systems' });

    await test.step('Navigate to template details and open dialog', async () => {
      await page.getByRole('button', { name: templateName }).click();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(templateName);
      page.getByRole('link', { name: 'Register and assign via API' }).click();
      await expect(modalPage).toBeVisible();
    });

    let rhcConnectCmd: string;

    await test.step('assign template to system with "Register and assign via API" button', async () => {
      await expect(
        modalPage.getByRole('button', { name: 'Register and assign via API' }),
      ).toBeVisible();
      rhcConnectCmd = await modalPage.locator('input[value*="rhc connect"]').inputValue();

      await modalPage.getByRole('button', { name: 'Close' }).first().click();
      await expect(modalPage).toBeHidden();
    });

    await test.step('Boot RHEL container and run commands', async () => {
      await regClient.Boot('rhel9');
      const activationKey = process.env.ACTIVATION_KEY_1 || '';
      const orgId = process.env.ORG_ID_1 || '';

      // Extract template ID from the rhc connect command
      const templateMatch = rhcConnectCmd.match(/--content-template[=\s]+(\S+)/);
      const templateId = templateMatch ? templateMatch[1] : undefined;

      if (!templateId) {
        throw new Error(`Could not extract template ID from command: ${rhcConnectCmd}`);
      }

      const reg = await regClient.RegisterRHC(activationKey, orgId, templateId);
      if (reg?.exitCode != 0) {
        console.log('Registration stdout:', reg?.stdout);
        console.log('Registration stderr:', reg?.stderr);
      }
      expect(reg?.exitCode, 'Expect registering to be successful').toBe(0);

      await refreshSubscriptionManager(regClient);
      await waitForRhcdActive(regClient);
    });

    await test.step('Verify system is attached to template', async () => {
      const hostname = await regClient.GetHostname();

      // Poll for system template attachment via API
      const isAttached = await pollForSystemTemplateAttachment(page, hostname, true, 10_000, 12);
      expect(isAttached, 'system should be attached to template').toBe(true);

      // Check if system row is visible with extended timeout
      const systemRow = page.getByRole('row').filter({ hasText: hostname });
      await expect(systemRow).toBeVisible({ timeout: 120000 });
    });
  });
});
