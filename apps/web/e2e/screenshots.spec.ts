import { test, expect } from '@playwright/test';

test.describe('Screenshots', () => {
  test('dashboard screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/dashboard.png', fullPage: true });
  });

  test('agents page screenshot', async ({ page }) => {
    await page.goto('/agents');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/agents.png', fullPage: true });
  });

  test('sessions page screenshot', async ({ page }) => {
    await page.goto('/sessions');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/sessions.png', fullPage: true });
  });

  test('logs page screenshot', async ({ page }) => {
    await page.goto('/logs');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/logs.png', fullPage: true });
  });

  test('integrations page screenshot', async ({ page }) => {
    await page.goto('/integrations');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/integrations.png', fullPage: true });
  });

  test('settings page screenshot', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/settings.png', fullPage: true });
  });
});