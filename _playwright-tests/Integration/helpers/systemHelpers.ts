import { Page, expect } from '@playwright/test';
import { performance } from 'perf_hooks';
import { INVENTORY_PATCH_POLL_TIMEOUT_MS } from '../../testConstants';

/**
 * Count matching systems in Patch.
 * @returns Promise<number> - number of matching systems, -1 on error
 */
export const isInPatch = async (
  page: Page,
  hostname: string,
  expectedAttachment: boolean = true,
): Promise<number> => {
  try {
    const response = await page.request.get(
      `/api/patch/v3/systems?search=${encodeURIComponent(hostname)}&limit=100`,
    );

    if (response.status() !== 200) {
      console.log(`⚠️  API request failed with status ${response.status()}`);
      return -1;
    }

    const body = await response.json();
    const system = body.data?.find(
      (sys: { attributes: { display_name: string } }) => sys.attributes.display_name === hostname,
    );

    if (!system) return 0;

    const hasTemplate = !!system.attributes?.template_uuid;
    if (hasTemplate === expectedAttachment) return 1;
    return 0;
  } catch (error) {
    console.log('⚠️  Error checking system in patch:', error);
    return -1;
  }
};

/**
 * Count matching systems in Inventory.
 * @returns Promise<number> - number of matching systems, -1 on error
 */
export const isInInventory = async (page: Page, hostname: string): Promise<number> => {
  try {
    const response = await page.request.get(
      `/api/inventory/v1/hosts?display_name=${encodeURIComponent(hostname)}`,
    );

    if (response.status() !== 200) {
      console.log(`⚠️  API request failed with status ${response.status()}`);
      return -1;
    }

    const body = await response.json();
    return body.results?.length ?? 0;
  } catch (error) {
    console.log('⚠️  Error checking system in inventory:', error);
    return -1;
  }
};

/**
 * Wait for host to appear in Inventory and Patch
 */
export const waitInPatch = async (
  page: Page,
  hostname: string,
  expectedAttachment: boolean = true,
): Promise<void> => {
  const start = performance.now();

  await expect
    .poll(async () => await isInInventory(page, hostname), {
      message: 'System did not appear in inventory in time',
      timeout: INVENTORY_PATCH_POLL_TIMEOUT_MS,
    })
    .toBe(1);

  const inventoryDone = performance.now();

  await expect
    .poll(async () => await isInPatch(page, hostname, expectedAttachment), {
      message: 'System did not appear in patch in time',
      timeout: INVENTORY_PATCH_POLL_TIMEOUT_MS,
    })
    .toBe(1);

  const end = performance.now();

  const inventoryDuration = (inventoryDone - start) / 1000;
  const patchDuration = (end - inventoryDone) / 1000;
  const wholeDuration = (end - start) / 1000;

  console.log(`Timing: processed_by_inventory_s - ${inventoryDuration.toFixed(3)}`);
  console.log(`Timing: processed_by_patch_s - ${patchDuration.toFixed(3)}`);
  console.log(`Timing: processed_by_insights_s - ${wholeDuration.toFixed(3)}`);
};
