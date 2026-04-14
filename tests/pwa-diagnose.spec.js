import { test, expect } from '@playwright/test';

test('diagnose PWA installation state', async ({ page }) => {
  // Navigate to the app
  const url = 'http://localhost:5173/Calculator/';
  await page.goto(url);

  // Wait for the app to initialize fully
  await page.waitForTimeout(3000);

  // Collect diagnostics
  const diagnostics = await page.evaluate(() => {
    // Try to find pwaManager through the app orchestrator
    const app = window.app;
    // We need to find where pwaManager is stored.
    // It's imported in app.js but not necessarily attached to window.app.
    // However, services/app.js:3 says: import { pwaManager } from './pwa.js';
    // And pwa.js exports it as 'pwaManager'.

    // Let's check for standard PWA indicators
    const results = {
      beforeinstallprompt_in_window: 'beforeinstallprompt' in window,
      navigator_standalone: window.navigator.standalone,
      is_standalone_match: window.matchMedia('(display-mode: standalone)')
        .matches,
      window___pwa_deferred_prompt: !!window.__pwa_deferred_prompt,
      navigator_serviceWorker_exists: !!navigator.serviceWorker,
      manifest_link_exists: !!document.querySelector('link[rel="manifest"]'),
      user_agent: navigator.userAgent,
    };

    // Try to get info from the pwaManager if we can find it
    // If it's not exported to window, we might need to check the pwa-prompt-captured listener

    return results;
  });

  console.log('--- PWA Diagnostics ---');
  console.log(JSON.stringify(diagnostics, null, 2));
  console.log('-----------------------');

  // Also check the actual text of the install button if it's visible
  const installBtn = page.locator('#pwa-install-btn');
  const isVisible = await installBtn.isVisible();
  console.log('Install Button Visible:', isVisible);

  if (isVisible) {
    // Try clicking it to see what toast appears
    await installBtn.click();
    await page.waitForTimeout(500);
    const toast = page.locator('#toast');
    const toastText = await toast.textContent();
    console.log('Toast Message on Click:', toastText?.trim());
  }
});
