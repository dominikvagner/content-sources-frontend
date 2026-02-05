import {
  CurrentsConfig,
  CurrentsFixtures,
  currentsReporter,
  CurrentsWorkerFixtures,
} from '@currents/playwright';
import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import path from 'path';
config({ path: path.join(__dirname, './.env'), quiet: true });

// Coverage setup flag: when true, run globalSetup to prepare coverage
const enableCoverageSetup = process.env.COVERAGE === 'true';

// Currents.dev configuration is created when both env vars are present
const currentsRecordKey = process.env.CURRENTS_RECORD_KEY;
const currentsProjectId = process.env.CURRENTS_PROJECT_ID;
const currentsConfig: CurrentsConfig | undefined =
  currentsRecordKey && currentsProjectId
    ? {
        recordKey: currentsRecordKey,
        projectId: currentsProjectId,
        coverage: {
          projects: ['UI', 'integration'],
        },
      }
    : undefined;

// Warn in CI when coverage is enabled but Currents is not configured
if (process.env.CI && enableCoverageSetup && !currentsConfig) {
  console.warn(
    'Warning: COVERAGE=true but CURRENTS_RECORD_KEY and/or CURRENTS_PROJECT_ID not set. ' +
      'Coverage data will be collected locally but not uploaded to Currents.dev.',
  );
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig<CurrentsFixtures, CurrentsWorkerFixtures>({
  testDir: './_playwright-tests/',
  // Run coverage global setup before tests (when COVERAGE=true)
  globalSetup: enableCoverageSetup ? './_playwright-tests/global-setup.coverage.ts' : undefined,
  fullyParallel: false,
  forbidOnly: false,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 3 : undefined,
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: 'playwright-report' }],
        [
          'playwright-ctrf-json-reporter',
          { outputDir: 'playwright-ctrf', outputFile: 'playwright-ctrf.json' },
        ],
        ...(currentsConfig ? [currentsReporter(currentsConfig)] : []),
      ]
    : 'list',
  globalTimeout: (process.env.INTEGRATION ? 35 : 20) * 60 * 1000,
  timeout: (process.env.INTEGRATION ? 6 : 4) * 60 * 1000, // 6m || 4m
  expect: { timeout: 30_000 }, // 30s
  use: {
    actionTimeout: 30_000, // 30s
    navigationTimeout: 30_000, // 30s
    launchOptions: {
      args: ['--use-fake-device-for-media-stream'],
    },
    ...(process.env.ADMIN_TOKEN
      ? {
          extraHTTPHeaders: {
            Authorization: process.env.ADMIN_TOKEN,
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
    screenshot: 'on',
    video: 'on',
    // Currents.dev configuration options for coverage collection (only in CI)
    ...(process.env.CI && currentsConfig ? { currentsConfigOptions: currentsConfig } : {}),
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/, use: { trace: 'off' } },
    process.env.INTEGRATION
      ? {
          name: 'integration',
          grepInvert: process.env.PROD
            ? [/preview-only/, /switch-to-preview/, /local-only/]
            : [/switch-to-preview/, /local-only/],
          use: {
            ...devices['Desktop Chrome'],
            storageState: `.auth/ADMIN_TOKEN.json`,
          },
          testIgnore: ['**/UI/**'],
          testDir: './_playwright-tests/Integration/',
          dependencies: ['setup'],
        }
      : {
          name: 'UI',
          use: {
            ...devices['Desktop Chrome'],
            storageState: '.auth/ADMIN_TOKEN.json',
          },
          testIgnore: ['**/Integration/**'],
          testDir: './_playwright-tests/UI/',
          dependencies: ['setup'],
        },
    ...(process.env.INTEGRATION && process.env.PROD
      ? [
          {
            name: 'Switch to preview',
            grep: [/switch-to-preview/],
            use: {
              ...devices['Desktop Chrome'],
              storageState: `.auth/ADMIN_TOKEN.json`,
            },
            dependencies: ['setup', 'integration'],
          },
          {
            name: 'Run preview only',
            grep: [/preview-only/],
            use: {
              ...devices['Desktop Chrome'],
              storageState: `.auth/ADMIN_TOKEN.json`,
            },
            testDir: './_playwright-tests/Integration',
            dependencies: ['Switch to preview'],
          },
        ]
      : []),
  ],
});
