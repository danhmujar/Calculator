import { test, expect } from '@playwright/test';

test.describe('Live Version Display', () => {
  test('Check version on live GitHub Pages site', async ({ page }) => {
    // Go directly to the live GitHub Pages site
    await page.goto('https://danhmujar.github.io/Calculator/');
    await page.waitForSelector('.calculator-svg', { state: 'attached' });

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
      { timeout: 10000 } // Longer timeout for live site
    );

    // Get the actual version text being displayed
    const versionText = await versionElement.textContent();
    console.log('Live version displayed:', versionText);

    // Check what version.json shows on the live site
    const versionJsonResponse = await page.request.get(
      'https://danhmujar.github.io/Calculator/version.json'
    );
    const versionJsonData = await versionJsonResponse.json();
    console.log('version.json content:', versionJsonData);

    // The version should match what's in version.json
    expect(versionText).toBe(versionJsonData.version);
  });
});
