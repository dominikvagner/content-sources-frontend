import { expect, test as setup } from '@playwright/test';
import {
  throwIfMissingEnvVariables,
  logInWithUser1,
  storeStorageStateAndToken,
} from './helpers/loginHelpers';
import { closePopupsIfExist, reloadOnSentry } from './UI/helpers/helpers';

setup.describe('Setup', async () => {
  setup('Ensure needed ENV variables exist', async () => {
    expect(() => throwIfMissingEnvVariables()).not.toThrow();
  });

  setup('Authenticate', async ({ page }) => {
    setup.setTimeout(90_000);
    await closePopupsIfExist(page);
    await reloadOnSentry(page);
    await logInWithUser1(page);
    await storeStorageStateAndToken(page);
  });
});
