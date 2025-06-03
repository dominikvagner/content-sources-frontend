import { test, expect } from '@playwright/test';

test('Content > getFeatures API', async ({ request }) => {
  const result = await request.get('/api/content-sources/v1/features/');
  expect(result.status()).toBe(200);
});

test('ImageBuilder > get blueprints API', async ({ request }) => {
  const result = await request.get('/api/image-builder/v1/blueprints?limit=10&offset=0');
  expect(result.status()).toBe(200);
});
