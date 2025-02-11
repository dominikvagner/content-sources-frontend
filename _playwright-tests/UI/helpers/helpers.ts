import { Page } from '@playwright/test';

export const closePopupsIfExist = async (page: Page) => {
  const locatorsToCheck = [
    page.locator('.pf-v5-c-alert.notification-item button'), // This closes all toast pop-ups
    page.locator(`button[id^="pendo-close-guide-"]`), // This closes the pendo guide pop-up
    page.locator(`button[id="truste-consent-button"]`), // This closes the trusted consent pup-up
    page.getByLabel('close-notification'), // This closes a one off info notification (May be covered by the toast above, needs recheck.)
  ];

  for (const locator of locatorsToCheck) {
    await page.addLocatorHandler(locator, async () => {
      await locator.click();
    });
  }
};
export const filterByName = async (page: Page, name: string) => {
  await page.getByPlaceholder(/^Filter by name.*$/).fill(name);
};

export const clearFilters = async (page: Page) => {
  try {
    await page.getByRole('button', { name: 'Clear filters' }).waitFor({ timeout: 5000 });
  } catch {
    return Promise<void>;
  }

  await page.getByRole('button', { name: 'Clear filters' }).click();
};

export const getRowByName = async (page: Page, name: string) => {
  await clearFilters(page);
  await filterByName(page, name);
  return page.getByRole('row').filter({ has: page.getByText(name) });
};
