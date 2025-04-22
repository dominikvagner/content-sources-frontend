import { expect, test as setup } from '@playwright/test';
import {
  throwIfMissingEnvVariables,
  logInWithUser1,
  storeStorageStateAndToken,
} from './helpers/loginHelpers';
import { closePopupsIfExist } from './UI/helpers/helpers';

setup.describe('Setup', async () => {
  setup.describe.configure({ retries: 3 });

  setup('Ensure needed ENV variables exist', async () => {
    expect(() => throwIfMissingEnvVariables()).not.toThrow();
  });

  setup('Authenticate', async ({ page }) => {
    setup.setTimeout(60_000);

    await closePopupsIfExist(page);
    await logInWithUser1(page);
    await storeStorageStateAndToken(page);
  });
});
