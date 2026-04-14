import { test, expect } from '@playwright/test';

test.describe('Version Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.calculator-svg', { state: 'attached' });
  });

  test('Version displays correctly in about modal', async ({ page }) => {
    // Click the about FAB button to open modal
    const aboutFabBtn = page.locator('#about-fab-btn');
    await aboutFabBtn.click();

    // Wait for modal to be visible
    const aboutOverlay = page.locator('.about-overlay.open');
    await expect(aboutOverlay).toBeVisible();

    // Wait for version element to appear and check it's not "Loading..."
    const versionElement = page.locator('#version-number');
    await expect(versionElement).toBeVisible();

    // Wait for the version to load (should not be "Loading..." after a short time)
    await page.waitForFunction(
      () => {
        const el = document.getElementById('version-number');
        return el && el.textContent !== 'Loading...';
      },
      { timeout: 5000 }
    );

    // Check that version is either a valid version string or "Unknown"
    const versionText = await versionElement.textContent();
    expect(['1.0', 'Unknown']).toContain(versionText);
  });
});
