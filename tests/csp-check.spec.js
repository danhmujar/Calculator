import { test, expect } from '@playwright/test';

test('should not have CSP violations in the console', async ({ page }) => {
  const violations = [];

  // Listen for console messages
  page.on('console', (msg) => {
    if (msg.text().toLowerCase().includes('content security policy')) {
      violations.push(msg.text());
    }
    // Also check for the specific inline script error
    if (
      msg.text().toLowerCase().includes('blocked') &&
      msg.text().toLowerCase().includes('script')
    ) {
      violations.push(msg.text());
    }
  });

  // Listen for page errors
  page.on('pageerror', (error) => {
    if (error.message.toLowerCase().includes('content security policy')) {
      violations.push(error.message);
    }
  });

  // Since we are checking local dev server started in background
  const url = 'http://localhost:5173/Calculator/';
  await page.goto(url);

  // Check if the early PWA script initialized the global variable
  const pwaPrompt = await page.evaluate(() => window.__pwa_deferred_prompt);
  expect(pwaPrompt).toBeDefined();

  // Wait a bit to ensure all scripts have loaded and potentially failed
  await page.waitForTimeout(1000);

  // Final check for violations
  if (violations.length > 0) {
    console.error('CSP Violations detected:', violations);
  }
  expect(violations).toHaveLength(0);
});
