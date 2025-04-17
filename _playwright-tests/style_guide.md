# Playwright Style Guide 💅

This style guide outlines the standards and best practices for writing Playwright tests based on the experience gathered during the creation of the Playwright POC.

Most of the things here are in-line with the [official Playwright best practices/guidelines](https://playwright.dev/docs/best-practices).
The official Playwright documentation is great and should be your first stop for any questions you have about Playwright.

## Table of Contents 📜

- [Best Practices ✨](#best-practices)
- [Test Structure 🏗](#test-structure)
- [Selectors 🔍](#selectors)
- [Caveats, gotchas and things to be aware of ⚠](#caveats-gotchas-and-things-to-be-aware-of)

## Best Practices ✨

1. **Test isolation**: \
   Each test should be independent and not rely on state from other tests.

2. **Test idempotency**: \
   Each test should be idempotent, i.e.: be able to run on repeat with the functionality and outcome.

3. **Parallelization**: \
   Structure tests to run in parallel for faster execution. Optimize the speed of tests, you want a speedy feedback loop.

4. **Use playwright's capturing features**: \
   Configure Playwright to take screenshots, videos and record test traces on test failures.

5. **Don't try to reinvent the wheel**: \
   Simplicity is king, only build custom (complicated/hard to maintain) things if there isn't a good solution out there.

6. **Keep abstractions to minimum**: \
   Don't use page objects, don't abstract selectors into variables (shared or not). The test should be easy to understand and readable as an article, after which you know what it does and don't have more questions than answers.

7. **Describe tests**: 
   - Use clear, descriptive test names that explain what you're testing.
   - Group tests in describes if they relate to the overarching feature.
   - Use steps to describe what the test does in more detail, these show up in the test report.
   - Don't use comments to describe the test, as they will not be visible in the report (only use them if you need to explain the code further, not the test).

8. **Helpers and fixtures**: \
   Extend Playwright with custom functionality only when the abstracted thing is generic enough.
   - Good examples: cleanup of resources before and after a test, navigation to your app with auto retrying, locating a row in a table.
   - Bad examples: page objects, clicking on a button, filling in a form (that's the core of the test, if you want to use that for setting up the test environment use the API).

9. **API tests**: \
   If you are heavily interacting with your API, or writing API tests, consider using an openapi generator to generate the API client and a fixture to set up the API client for all tests that need it.

## Test Structure 🏗
Recommended folder/file structure, this will make it easier to run multiple test suites and once and share helpers/fixtures if desired.

```
/_playwright-tests
  /utils             # Testing utilities
    /helpers         # Helper functions/snippets
    /fixtures        # Playwright automatic fixtures
  /UI                # UI/API depending on the repository, containing the tests
    some-feature.spec.ts
```

Each test file should follow this general structure:

```typescript name=example.spec.ts
import { test, expect } from '@playwright/test';
import { setupTest, closePopups } from '../utils/helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Common setup for each test
    await setupTest(page);
  });

  test('should perform some action correctly', async (page, customFixture) => {
    test.step('naviagat to page', async () => {
      await yourPage.navigate();
      await closePopups(page);
    });

    test.step('do something and verify it', async () => {
      await yourPage.getByRole().action();
      await expect(yourPage.resultElement).toBeVisible();
    });

    // More steps...
  });

  // More tests...
});
```

## Selectors 🔍

In order of preference, use these selector strategies:

1. **Roles with name**

   This is highly preferred, because this selector actually reflects how
   users and assistive technology perceive the page, i.e.: tests user-visible behavior.
   Beware that the name is an [accessible name](https://w3c.github.io/accname/#dfn-accessible-name), not just the HTML 'name' attribute.

   ```typescript
   page.getByRole('button', { name: 'Submit' });
   ```

2. **Text content** (when applicable)
   If possible, use with the `exact` option set to true.

   ```typescript
   page.getByText('Welcome to the application');
   ```

3. **Test IDs** (for hard to locate elements)

   ```typescript
   page.locator('data-testid=submit-button');
   ```
 
4. **CSS selectors** (only when necessary)

   ```typescript
   page.locator('.card-container .card-title');
   ```

Avoid using:

- XPath selectors unless absolutely necessary
- Selectors that depend on specific layout or styling that might change

## Caveats, gotchas and things to be aware of ⚠

- When working with PF modals/wizards/dialogs, there is a problem where they don't correctly 'hide'/disable the page behind them.
  - This can cause issues with Playwright, as it might try to interact with elements that are/should not visible or enabled.
  - To work around this, you can target the dialog and save it to a variable, then use that variable to interact with any elements inside the dialog.
    ```typescript
    const modal = page.getByRole('dialog', { name: 'Title' });
    modal.getByRole('button', { name: 'Submit' }).click();
    ```

- Navigation inside Insights (stage and proxy especially) can be flaky.
  - This can be caused by multiple reasons (stage/proxy instability, sentry errors, cache failures, slooow loads 🐌).
  - If you are experiencing this, try to add retry logic to the navigation.
