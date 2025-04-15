import { defineConfig, devices, ReporterDescription } from '@playwright/test';
import 'dotenv/config';

const reporters: ReporterDescription[] = [['html'], ['list']];

// if (process.env.CURRENTS_PROJECT_ID && process.env.CURRENTS_RECORD_KEY) {
//   reporters.push(['@currents/playwright']);
// }

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './_playwright-tests/',
  fullyParallel: false,
  forbidOnly: false,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 4,
  reporter: reporters,
  globalTimeout: 20 * 60 * 1000, // 20m, Set because of codebuild, we want PW to timeout before CB to get the results.
  timeout: 5 * 60 * 1000, // 5
  expect: { timeout: 30_000 }, // 30s
  use: {
    actionTimeout: 30_000, // 30s
    navigationTimeout: 30_000, // 30s
    launchOptions: {
      args: ['--use-fake-device-for-media-stream'],
    },
    ...(process.env.TOKEN
      ? {
          extraHTTPHeaders: {
            Authorization: process.env.TOKEN,
          },
        }
      : {}),
    baseURL: process.env.BASE_URL,
    ignoreHTTPSErrors: true,
    ...(process.env.PROXY
      ? {
          proxy: {
            server: process.env.PROXY,
          },
        }
      : {}),
    testIdAttribute: 'data-ouia-component-id',
    trace: 'on',
    screenshot: 'off',
    video: 'on',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
