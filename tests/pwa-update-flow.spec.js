import { test, expect } from '@playwright/test';

test.describe('PWA Update Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept version.json to control the version
    await page.route('**/version.json*', async (route) => {
      const url = new URL(route.request().url());
      const timestamp = url.searchParams.get('t');

      // If it's the first call or specifically requested, return v1
      // Otherwise we can alternate to simulate an update
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          version: '1.0.TEST_INITIAL',
          timestamp: new Date().toISOString(),
        }),
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    });

    await page.goto('/');
    // Wait for app to initialize
    await page.waitForFunction(
      () => window.pwaManager && window.pwaManager.isInitialized
    );
  });

  test('PWA-04: Version mismatch triggers Service Worker update check', async ({
    page,
  }) => {
    // Mock the registration.update method to see if it gets called
    await page.evaluate(() => {
      window.pwaManager.registration = {
        update: () => {
          window.__updateCalled = true;
          // Also dispatch the event that the UI expects
          window.dispatchEvent(
            new CustomEvent('pwa-update-available', {
              detail: { updateCallback: () => {} },
            })
          );
          return Promise.resolve();
        },
      };
    });

    // Update the route to return a new version
    await page.route('**/version.json*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          version: '1.0.TEST_NEW',
          timestamp: new Date().toISOString(),
        }),
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    });

    // Trigger checkVersion manually for the test
    await page.evaluate(async () => {
      await window.pwaManager.checkVersion();
    });

    // Check if update was called
    const updateCalled = await page.evaluate(() => window.__updateCalled);
    expect(updateCalled).toBe(true);

    // Check if the toast appeared in the UI
    const toast = page.locator('#update-toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('A new version is available!');
  });
});
