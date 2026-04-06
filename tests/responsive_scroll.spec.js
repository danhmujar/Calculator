import { test, expect } from '@playwright/test';

/**
 * Visual Verification Script:
 * 1. Load app in Desktop size.
 * 2. Reload the page.
 * 3. Wait 2 seconds.
 * 4. Switch to Mobile resolution.
 * 5. Wait 2 seconds.
 * 6. Scroll to the last two percentage cards.
 * 7. Capture screenshot.
 */
test('verify persistence and mobile scroll alignment', async ({ page }) => {
  // 1. Set Desktop resolution and navigate
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');

  // 2. Reload
  await page.reload();

  // 3. Wait for 2 seconds
  await page.waitForTimeout(2000);

  // 4. Switch to Mobile resolution
  await page.setViewportSize({ width: 375, height: 812 });

  // 5. Wait for 2 seconds (allows syncLayoutDuringTransition to finish)
  await page.waitForTimeout(2000);

  // 6. Scroll to the last two percentage cards
  const cards = page.locator('.calc-card');
  const count = await cards.count();
  
  if (count >= 2) {
    const lastCard = cards.nth(count - 1);
    const secondToLastCard = cards.nth(count - 2);
    
    // Scroll so that both are likely visible in the viewport
    await secondToLastCard.scrollIntoViewIfNeeded();
  }

  // 7. Take the screenshot
  await page.screenshot({ 
    path: 'screenshots/last_cards_mobile.png'
  });

  console.log('Screenshot saved to screenshots/last_cards_mobile.png');
});
