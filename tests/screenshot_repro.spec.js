import { test, expect } from '@playwright/test';

/**
 * Bug Reproduction & Verification Script:
 * 1. Load app in Desktop resolution.
 * 2. Add 2 rows to the first percentage card (Total 3 rows).
 * 3. Switch to Mobile resolution (375px).
 * 4. Verify WebGL and DOM alignment via screenshot.
 */
test('verify responsive alignment and row transitions', async ({ page }) => {
  // 1. Set Desktop resolution and navigate
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');

  // Wait for initial load
  await expect(page.locator('.calc-card[data-type="type1"]')).toBeVisible();

  // 2. Add 2 rows from the first percentage card
  const addRowBtn = page.locator('.calc-card[data-type="type1"] .add-row-btn');
  
  // Click twice to add two more rows
  await addRowBtn.click();
  await page.waitForTimeout(600); // Wait for CSS transition
  await addRowBtn.click();
  await page.waitForTimeout(600); // Wait for CSS transition

  // Verify we have 3 rows total (1 default + 2 added)
  const rows = page.locator('.calc-card[data-type="type1"] .calc-row-instance');
  await expect(rows).toHaveCount(3);

  // 3. Change resolution to mobile
  // This triggers the setupResizeHandler and the syncLayoutDuringTransition loop
  await page.setViewportSize({ width: 375, height: 812 });
  
  // Wait for the 0.5s CSS layout animation to complete
  await page.waitForTimeout(1000);

  // 4. Take the screenshot
  // Saving to 'screenshots/' directory
  await page.screenshot({ 
    path: 'screenshots/responsive_alignment_check.png', 
    fullPage: true 
  });

  console.log('Screenshot saved to screenshots/responsive_alignment_check.png');
});
