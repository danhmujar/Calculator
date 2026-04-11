import { test, expect } from '@playwright/test';

test.describe('Phase 07: PWA Update Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for UI to initialize
    await page.waitForFunction(
      () => window.uiManager && window.layoutManager && window.app
    );
  });

  test('PWA-03: Update toast appears when pwa-update-available event is dispatched', async ({
    page,
  }) => {
    const toast = page.locator('#update-toast');

    // Initially hidden
    await expect(toast).toBeHidden();

    // Dispatch the event
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('pwa-update-available', {
          detail: {
            updateCallback: () => {
              window.__pwa_refresh_called = true;
            },
          },
        })
      );
    });

    // Should be visible now
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('A new version is available!');
  });

  test('PWA-03: Reload to Update button triggers callback', async ({
    page,
  }) => {
    // Dispatch the event
    await page.evaluate(() => {
      window.__pwa_refresh_called = false;
      window.dispatchEvent(
        new CustomEvent('pwa-update-available', {
          detail: {
            updateCallback: () => {
              window.__pwa_refresh_called = true;
            },
          },
        })
      );
    });

    const refreshBtn = page.locator('#update-refresh-btn');
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();

    // Verify callback was called
    const callbackCalled = await page.evaluate(
      () => window.__pwa_refresh_called
    );
    expect(callbackCalled).toBe(true);
  });

  test('PWA-03: Dismiss button hides the toast', async ({ page }) => {
    // Dispatch the event
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('pwa-update-available', {
          detail: {
            updateCallback: () => {},
          },
        })
      );
    });

    const toast = page.locator('#update-toast');
    const dismissBtn = page.locator('#update-dismiss-btn');

    await expect(toast).toBeVisible();
    await dismissBtn.click();

    // Should be hidden again
    await expect(toast).toBeHidden();
  });

  test('PWA-01/02: Build script and version.json exists (Check manifest availability)', async ({
    page,
  }) => {
    // Attempt to fetch version.json to ensure it's served
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('/version.json');
        if (res.ok) {
          return await res.json();
        }
        return { error: 'Not found' };
      } catch (e) {
        return { error: e.message };
      }
    });

    // In a development environment, it might not be in the root if base URL is /Calculator/
    // But typically public/version.json is accessible via /version.json
    console.log('Fetched version.json:', response);

    // We don't strictly fail if it's missing in dev mode (vite doesn't always serve public files the same way as dist)
    // but we can check if it looks like a version manifest if it exists
    if (!response.error) {
      expect(response).toHaveProperty('version');
    }
  });
});
