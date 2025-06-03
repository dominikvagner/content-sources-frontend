import { test, expect } from '@playwright/test';
import { RHSMClient } from '../rhsmClient';

test('RHSM client', async ({}, testInfo) => {
  // change the test timeout as registering a client can be slow
  testInfo.setTimeout(5 * 60 * 1000); // Five minutes

  // Create a client with a test-specific name
  const client = new RHSMClient('RHSMClientTest');

  // Start the rhel9 container
  await client.Boot('rhel9');

  // Register, overriding the default key and org
  const reg = await client.RegisterSubMan('my_activation_key', 'my_org_id');
  if (reg?.exitCode != 0) {
    console.log(reg?.stdout);
    console.log(reg?.stderr);
  }
  expect(reg?.exitCode).toBe(0);

  // vim-enhanced shouldn't be installed
  const notExist = await client.Exec(['rpm', '-q', 'vim-enhanced']);
  expect(notExist?.exitCode).not.toBe(0);

  // Install vim-enhanced, expect it to finish in 60 seconds
  const yumInstall = await client.Exec(['yum', 'install', '-y', 'vim-enhanced'], 60000);
  expect(yumInstall?.exitCode).toBe(0);

  // Now vim-enhanced should be installed
  const exist = await client.Exec(['rpm', '-q', 'vim-enhanced']);
  expect(exist?.exitCode).toBe(0);

  await client.Destroy();
});
