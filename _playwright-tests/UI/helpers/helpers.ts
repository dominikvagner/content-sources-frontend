import { Page, Locator, expect } from '@playwright/test';

export const closePopupsIfExist = async (page: Page) => {
  const locatorsToCheck = [
    page.locator('.pf-v5-c-alert.notification-item button'), // This closes all toast pop-ups
    page.locator(`button[id^="pendo-close-guide-"]`), // This closes the pendo guide pop-up
    page.locator(`button[id="truste-consent-button"]`), // This closes the trusted consent pop-up
    page.getByLabel('close-notification'), // This closes a one off info notification (May be covered by the toast above, needs recheck.)
  ];

  for (const locator of locatorsToCheck) {
    await page.addLocatorHandler(locator, async () => {
      try {
        await locator.first().click(); // There can be multiple toast pop-ups
      } catch {
        return;
      }
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
    return;
  }

  await page.getByRole('button', { name: 'Clear filters' }).click();
};

export const getRowByName = async (page: Page, name: string) => {
  await clearFilters(page);
  await filterByName(page, name);
  return page.getByRole('row').filter({ has: page.getByText(name) });
};

export const getRowCellByHeader = async (row: Locator, name: string) => {
  const table = row.locator('xpath=ancestor::*[@role="grid" or @role="table"][1]');
  const headers = table.getByRole('columnheader');
  const headerCount = await headers.count();

  let index = -1;
  for (let i = 0; i < headerCount; i++) {
    let headerContent = (await headers.nth(i).textContent()) || '';
    headerContent = headerContent.trim();

    if (headerContent.includes(name)) {
      index = i;
      break;
    }
  }

  if (index == -1) {
    throw new Error(`Header "${name}" not found in the table/grid.`);
  }

  return row.getByRole('gridcell').nth(index);
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitForTaskPickup = async ({ request }: Page, repoUrl: string, type: string) => {
  const response = await request.get(`/api/content-sources/v1/repositories/?url=${repoUrl}`);
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body.data)).toBeTruthy();
  const uuidList = body.data.map((data: { uuid: string }) => data.uuid) as string[];
  expect(uuidList.length).toEqual(1);

  const repoUuid = uuidList[0];
  while (true) {
    const response = await request.get(
      `/api/content-sources/v1/tasks/?repository_uuid=${repoUuid}&type=${type}&status=pending&limit=1`,
    );
    const body = await response.json();
    const data = Array.from(body.data);
    if (data.length === 0) {
      break;
    }
    await sleep(3000);
  }

  return;
};

export const retry = async (page: Page, callback: (page: Page) => Promise<void>, retries = 3) => {
  let rc = retries;
  while (rc >= 0) {
    rc -= 1;

    if (rc === 0) {
      return await callback(page);
    } else {
      try {
        await callback(page);
      } catch {
        continue;
      }
      break;
    }
  }

  return;
};
