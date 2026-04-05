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

    // Wait for the background color to match one of the allowed values (accounting for transition)
    const allowedColors = [
        'rgba(255, 255, 255, 0.45)',
        'rgba(28, 30, 36, 0.45)'
    ];

    await page.waitForFunction((colors) => {
        const style = window.getComputedStyle(document.getElementById('main-calc-display'));
        return colors.includes(style.backgroundColor);
    }, allowedColors);

    const backgroundColor = await page.evaluate(() => {
        const style = window.getComputedStyle(document.getElementById('main-calc-display'));
        return style.backgroundColor;
    });

    const calcDisplayColor = await page.evaluate(() => {
        const el = document.querySelector('.calc-display');
        return el ? window.getComputedStyle(el).backgroundColor : 'NOT FOUND';
    });

    const sciColor = await page.evaluate(() => {
        const el = document.getElementById('sci-container');
        return el ? window.getComputedStyle(el).backgroundColor : 'NOT FOUND';
    });

    console.log('Detected background color:', backgroundColor);
    console.log('Calc display container color:', calcDisplayColor);
    console.log('Sci container color:', sciColor);

    expect(allowedColors).toContain(backgroundColor);
  });
});
