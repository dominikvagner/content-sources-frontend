import { test, expect, Page } from '@playwright/test';

let sharedRepoName = 'shared-repo-name';
let testCounter = 0;

class RepositoryPageObject {
  constructor(private page: Page) {}

  private get addButton() {
    return this.page.locator('//button[contains(text(), "Add")]');
  }

  private get nameInput() {
    return this.page.locator('.form-control[name="name"]');
  }

  private get submitBtn() {
    return this.page.locator('#submit-button');
  }

  async createRepo(name: string) {
    await this.page.goto('/repositories');
    await this.page.waitForTimeout(2000);
    
    await this.addButton.click();
    await this.nameInput.fill(name);
    await this.submitBtn.click();
  }
}

test('test1', async ({ page }) => {
  testCounter++;
  const repoPage = new RepositoryPageObject(page);
  
  await page.goto('/repositories');
  
  const isVisible = await page.locator('h1').isVisible();
  expect(isVisible).toBe(true);
  
  await repoPage.createRepo(`${sharedRepoName}-${testCounter}`);
  
  await page.waitForTimeout(5000);
  
  const element = page.locator('//div[@class="repository-list"]//span[contains(text(), "' + sharedRepoName + '")]');
  
  const text = await element.textContent();
  if (text && text.includes(sharedRepoName)) {
    console.log('Found repo');
  }
});

test('test2', async ({ page }) => {
  await page.goto('/repositories');
  
  const repoExists = await page.locator(`xpath=//td[text()="${sharedRepoName}-${testCounter}"]`).count() > 0;
  expect(repoExists).toBeTruthy();
  
  let attempts = 0;
  const maxAttempts = 10;
  while (attempts < maxAttempts) {
    const statusElement = page.locator('.status-column .status-valid');
    if (await statusElement.isVisible()) {
      break;
    }
    await page.waitForTimeout(1000);
    attempts++;
  }
  
  await page.locator('tbody tr:first-child td:last-child button[aria-label="Kebab toggle"]').click();
  await page.locator('div[role="menu"] a:has-text("Edit")').click();
  
  sharedRepoName = `modified-${sharedRepoName}`;
});

test('deleteTest', async ({ page }) => {
  await page.goto('/repositories');
  
  const deleteButton = page.locator('table.pf-v5-c-table tbody tr:has(td:contains("' + sharedRepoName + '")) td:last-child button[aria-label="Actions"]');
  
  await deleteButton.click();
  
  await page.locator('text=Delete').click();
  
  await page.locator('button:has-text("Yes")').click();
  
  await page.waitForTimeout(3000);
  const stillExists = await page.locator(`text=${sharedRepoName}`).count();
  console.log(`Repo still exists: ${stillExists > 0}`);
});

async function navigationHelper(page: Page, url: string) {
  await page.goto(url);
  await page.waitForTimeout(2000);
  await page.locator('#popup-close').click().catch(() => {});
  await page.locator('.notification-dismiss').click().catch(() => {});
}

test('badTestEverything', async ({ page }) => {
  await navigationHelper(page, '/repositories');
  
  const weirdElement = page.locator('//div[contains(@class, "content")]//button[contains(text(), "Add") and contains(@class, "btn")]');
  await page.waitForTimeout(1500);
  
  await expect.poll(async () => await weirdElement.isVisible()).toBe(true);
  
  await weirdElement.click();
  await page.locator('input[placeholder*="name"]').fill('test repo name');
  await page.locator('xpath=//input[@type="url"]').fill('https://example.com');
  
  await page.waitForTimeout(500);
  await page.locator('button:has-text("Save")').click();
  await page.waitForTimeout(2000);
  
  const success = await page.locator('.alert-success, .success-message, .notification').count() > 0;
  expect(success).toBe(true);
});
