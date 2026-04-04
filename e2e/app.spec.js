// @ts-check
const { test, expect } = require('@playwright/test');

test('has title', async ({ page }) => {
  // Use Jenkins-provided URL if available, otherwise default to local root
  const targetUrl = process.env.CI_ENVIRONMENT_URL || 'http://localhost:3000';
  await page.goto(targetUrl);

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Learn Jenkins/);
});

test('has Jenkins in the body', async ({ page }) => {
  const targetUrl = process.env.CI_ENVIRONMENT_URL || 'http://localhost:3000';
  await page.goto(targetUrl);

  const isVisible = await page.locator('a:has-text("Learn Jenkins on Udemy")').isVisible();
  expect(isVisible).toBeTruthy();
});

test('has expected app version', async ({ page }) => {
  const targetUrl = process.env.CI_ENVIRONMENT_URL || 'http://localhost:3000';
  await page.goto(targetUrl);

  const expectedAppVersion = process.env.REACT_APP_VERSION ? process.env.REACT_APP_VERSION : '1';

  console.log(expectedAppVersion);

  const isVisible = await page.locator(`p:has-text("Application version: ${expectedAppVersion}")`).isVisible();
  expect(isVisible).toBeTruthy();
});
