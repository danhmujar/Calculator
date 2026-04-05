import { test, expect } from '@playwright/test';

test.describe('Project Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to be ready
    await page.waitForSelector('.calculator-svg', { state: 'attached' });
    await page.waitForFunction(() => window.layoutManager && window.uiManager);
  });

  test('Capture Main Calculator and About Modal', async ({ page }) => {
    // 1. Capture Main Calculator Panel (Standard Mode)
    // We'll wait a bit for the entrance animations to finish
    await page.waitForTimeout(1000);
    
    // Force webgl-active class if it's not already there for the screenshot
    await page.evaluate(() => document.body.classList.add('webgl-active'));
    
    await page.screenshot({ path: 'screenshots/main-calculator.png', fullPage: true });
    console.log('Main calculator screenshot saved to screenshots/main-calculator.png');

    // 2. Open and Capture About Modal
    const aboutFabBtn = page.locator('#about-fab-btn');
    await aboutFabBtn.click();
    
    const aboutModal = page.locator('.about-modal');
    await expect(aboutModal).toBeVisible();
    
    // Wait for modal animation
    await page.waitForTimeout(500);
    
    await aboutModal.screenshot({ path: 'screenshots/about-modal.png' });
    console.log('About modal screenshot saved to screenshots/about-modal.png');
  });
});
