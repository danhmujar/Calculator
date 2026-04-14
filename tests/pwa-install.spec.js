import { test, expect } from '@playwright/test';

test('verify install button works locally after fix', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/Calculator/');

  // Wait for app to load
  await page.waitForTimeout(3000);

  // Check manifest link exists
  const manifestLink = await page
    .locator('link[rel="manifest"]')
    .first()
    .getAttribute('href');
  console.log('Manifest Link:', manifestLink);

  // Open About modal
  await page.click('#about-fab-btn');
  await page.waitForSelector('#about-overlay.open');

  // Check button state before mock
  const btnStateBefore = await page.evaluate(() => {
    const btn = document.getElementById('pwa-install-btn');
    return {
      hidden: btn ? btn.hidden : null,
      display: btn ? getComputedStyle(btn).display : null,
    };
  });
  console.log('Button before mock:', btnStateBefore);

  // Mock beforeinstallprompt
  await page.evaluate(() => {
    window.beforeinstallprompt = null;
    const event = new Event('beforeinstallprompt');
    Object.defineProperty(event, 'preventDefault', { value: () => {} });
    Object.defineProperty(event, 'prompt', { value: () => Promise.resolve() });
    Object.defineProperty(event, 'userChoice', {
      value: Promise.resolve({ outcome: 'accepted' }),
    });
    window.dispatchEvent(event);
  });

  await page.waitForTimeout(500);

  // Check if button is now visible
  const btnVisible = await page.locator('#pwa-install-btn').isVisible();
  console.log('Install Button Visible (after mock):', btnVisible);

  expect(manifestLink).toContain('manifest');
  expect(btnVisible).toBe(true);
});
