import { test, expect } from 'test-utils';
import { navigateToTemplates } from './helpers/navHelpers';
import { closeGenericPopupsIfExist } from './helpers/helpers';

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
        /^https:\/\/docs\.redhat\.com\/en\/documentation\/red_hat_lightspeed\/.*content-template.*$/,
      );
      await expect(docsPage.getByText(/^.*Using content templates.*$/).first()).toBeVisible();
      await expect(
        docsPage.getByText('A content template is a set of repository snapshots').first(),
      ).toBeVisible();
    });
  });
});
