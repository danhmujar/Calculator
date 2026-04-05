import { test, expect } from '@playwright/test';

test.describe('Phase 5', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.calculator-svg', { state: 'attached' });
    await page.waitForFunction(() => window.layoutManager && window.uiManager);
  });

  test('REQ-01: Connect About Modal to WebGL Blur Sync', async ({ page }) => {
    const aboutFabBtn = page.locator('#about-fab-btn');
    await aboutFabBtn.click();
    
    const aboutOverlay = page.locator('.about-overlay.open');
    await expect(aboutOverlay).toBeVisible();

    const isRegistered = await page.evaluate(() => {
        return Array.from(window.layoutManager.elements.entries()).some(([el, id]) => id === 'about-modal');
    });

    expect(isRegistered).toBe(true);
  });

  test('REQ-02: Fix Main Calculator Display Transparency', async ({ page }) => {
    // Force webgl-active class to trigger transparency CSS
    await page.evaluate(() => {
        document.body.classList.add('webgl-active');
    });

    const bodyClasses = await page.evaluate(() => document.body.className);
    console.log('Body classes:', bodyClasses);

    // Wait for the background color to become semi-transparent
    await page.waitForFunction(() => {
        const el = document.querySelector('.calc-display');
        const color = window.getComputedStyle(el).backgroundColor;
        const parts = color.match(/[\d.]+/g);
        if (parts && parts.length === 4) {
            const alpha = parseFloat(parts[3]);
            return alpha >= 0.4 && alpha <= 0.6;
        }
        return false;
    }, { timeout: 10000 });

    const backgroundColor = await page.evaluate(() => {
        const el = document.querySelector('.calc-display');
        return window.getComputedStyle(el).backgroundColor;
    });

    console.log('Background:', backgroundColor);
    const parts = backgroundColor.match(/[\d.]+/g);
    const alpha = (parts && parts.length === 4) ? parseFloat(parts[3]) : 1;
    
    expect(alpha).toBeGreaterThanOrEqual(0.4);
    expect(alpha).toBeLessThanOrEqual(0.6);
  });
});
