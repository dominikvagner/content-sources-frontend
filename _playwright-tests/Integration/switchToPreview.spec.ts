import { test, expect } from 'test-utils';
import { navigateToRepositories } from '../UI/helpers/navHelpers';
import { ensureInPreview } from '../authHelpers';

test.describe('Switch to preview', { tag: '@switch-to-preview' }, () => {
  test('Click preview button', async ({ page }) => {
    await navigateToRepositories(page);
    await ensureInPreview(page);
    const toggle = page.locator('div').filter({ hasText: 'Preview mode' }).getByRole('switch');
    await expect(toggle).toBeChecked();
  });
});
