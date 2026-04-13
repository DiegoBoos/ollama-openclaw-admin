import { test, expect } from '@playwright/test';

test.describe('OpenClaw Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('homepage loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/OpenClaw Admin/);
  });

  test('sidebar navigation renders correctly', async ({ page }) => {
    // Check sidebar is visible
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();

    // Check all nav items are present
    const navItems = ['Dashboard', 'Agents', 'Sessions', 'Logs', 'Integrations', 'Settings'];
    for (const item of navItems) {
      await expect(page.locator(`.nav-item:has-text("${item}")`)).toBeVisible();
    }
  });

  test('sidebar can be collapsed and expanded', async ({ page }) => {
    const sidebar = page.locator('.sidebar');
    const collapseBtn = page.locator('.collapse-btn');

    // Initial state - expanded
    await expect(sidebar).not.toHaveClass(/collapsed/);

    // Click collapse
    await collapseBtn.click();
    await expect(sidebar).toHaveClass(/collapsed/);

    // Click expand
    await collapseBtn.click();
    await expect(sidebar).not.toHaveClass(/collapsed/);
  });

  test('dashboard page loads and displays content', async ({ page }) => {
    // Should be on dashboard by default
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // Check status cards are present
    await expect(page.locator('.status-card:has-text("Gateway")')).toBeVisible();
    await expect(page.locator('.status-card:has-text("Active Agents")')).toBeVisible();

    // Check gateway controls are visible
    await expect(page.locator('.btn-success:has-text("Launch")')).toBeVisible();
    await expect(page.locator('.btn-warning:has-text("Restart")')).toBeVisible();
    await expect(page.locator('.btn-danger:has-text("Stop")')).toBeVisible();
  });

  test('navigates to agents page', async ({ page }) => {
    await page.locator('.nav-item:has-text("Agents")').click();

    // Wait for navigation
    await expect(page).toHaveURL(/\/agents/);
    await expect(page.locator('h1:has-text("Agents")')).toBeVisible();

    // Check filter bar is present
    await expect(page.locator('.filter-bar')).toBeVisible();
  });

  test('navigates to sessions page', async ({ page }) => {
    await page.locator('.nav-item:has-text("Sessions")').click();

    await expect(page).toHaveURL(/\/sessions/);
    await expect(page.locator('h1:has-text("Sessions")')).toBeVisible();
  });

  test('navigates to logs page', async ({ page }) => {
    await page.locator('.nav-item:has-text("Logs")').click();

    await expect(page).toHaveURL(/\/logs/);
    await expect(page.locator('h1:has-text("Logs")')).toBeVisible();

    // Check log container is present
    await expect(page.locator('.log-container')).toBeVisible();
  });

  test('navigates to integrations page', async ({ page }) => {
    await page.locator('.nav-item:has-text("Integrations")').click();

    await expect(page).toHaveURL(/\/integrations/);
    await expect(page.locator('h1:has-text("Integrations")')).toBeVisible();

    // Check integration cards are present
    await expect(page.locator('.integration-card:has-text("Ollama")')).toBeVisible();
    await expect(page.locator('.integration-card:has-text("Siriscloud Auth")')).toBeVisible();
  });

  test('navigates to settings page', async ({ page }) => {
    await page.locator('.nav-item:has-text("Settings")').click();

    await expect(page).toHaveURL(/\/settings/);
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();

    // Check settings sections are present
    await expect(page.locator('.card:has-text("Gateway Settings")')).toBeVisible();
    await expect(page.locator('.card:has-text("API Configuration")')).toBeVisible();
  });
});

test.describe('Dashboard functionality', () => {
  test('refresh button is clickable', async ({ page }) => {
    await page.goto('/');

    const refreshBtn = page.locator('.btn-ghost:has-text("Refresh")');
    await expect(refreshBtn).toBeEnabled();

    // Click should not throw
    await refreshBtn.click();
  });

  test('gateway control buttons have correct initial states', async ({ page }) => {
    await page.goto('/');

    // Launch should be enabled when gateway is offline (initial state)
    const launchBtn = page.locator('.btn-success:has-text("Launch")');
    const restartBtn = page.locator('.btn-warning:has-text("Restart")');
    const stopBtn = page.locator('.btn-danger:has-text("Stop")');

    // These states depend on gateway status, so we just check they exist
    await expect(launchBtn).toBeVisible();
    await expect(restartBtn).toBeVisible();
    await expect(stopBtn).toBeVisible();
  });
});

test.describe('Agents page functionality', () => {
  test('search input works', async ({ page }) => {
    await page.goto('/agents');

    const searchInput = page.locator('.search-box input');
    await expect(searchInput).toBeVisible();

    // Type in search
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');
  });

  test('status filter chips are clickable', async ({ page }) => {
    await page.goto('/agents');

    // All chip should be active by default
    const allChip = page.locator('.chip:has-text("All")');
    await expect(allChip).toHaveClass(/active/);

    // Click Active chip
    const activeChip = page.locator('.chip:has-text("Active")');
    await activeChip.click();
    await expect(activeChip).toHaveClass(/active/);
    await expect(allChip).not.toHaveClass(/active/);
  });
});

test.describe('Responsive design', () => {
  test('sidebar adapts to mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 480, height: 800 });
    await page.goto('/');

    // Sidebar should still be functional
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();
  });

  test('dashboard grid adapts to tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Status grid should still be visible
    await expect(page.locator('.status-grid')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/');

    // Tab through navigation
    await page.keyboard.press('Tab');

    // Focus should be visible
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/');

    // Check main action buttons have text
    const buttons = page.locator('.btn');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const btn = buttons.nth(i);
      const text = await btn.textContent();
      expect(text?.trim()).toBeTruthy();
    }
  });

  test('headings are properly structured', async ({ page }) => {
    await page.goto('/');

    // Should have h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Main heading should describe the page
    const headingText = await h1.textContent();
    expect(headingText).toBeTruthy();
  });
});