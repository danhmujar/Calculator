import { test, expect } from '@playwright/test';

test('verify pwaManager acknowledges installability when prompt is present', async ({
  page,
}) => {
  const url = 'http://localhost:5173/Calculator/';
  await page.goto(url);

  // Wait for the app to initialize
  await page.waitForTimeout(2000);

  // Mock and verify
  const results = await page.evaluate(() => {
    const pm = window.pwaManager;
    if (!pm) return { error: 'pwaManager not found' };

    const initialStatus = pm.getInstallStatus();
    const initialInstallable = pm.isInstallable();

    // Mock a prompt
    const mockPrompt = {
      prompt: () => {
        window.__prompt_called = true;
      },
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };

    // Set the prompt in window (pwa-early.js style)
    window.__pwa_deferred_prompt = mockPrompt;
    // Notify pwaManager
    window.dispatchEvent(new CustomEvent('pwa-prompt-captured'));

    return {
      initialStatus,
      initialInstallable,
      statusAfterCapture: pm.getInstallStatus(),
      installableAfterCapture: pm.isInstallable(),
      hasDeferredPrompt: pm.deferredInstallPrompt !== null,
    };
  });

  console.log('Test Results:', JSON.stringify(results, null, 2));

  if (results.error) {
    throw new Error(results.error);
  }

  // Before fix: installableAfterCapture would be false if 'beforeinstallprompt' not in window
  // After fix: installableAfterCapture should be true because deferredInstallPrompt is set
  expect(results.installableAfterCapture).toBe(true);
  expect(results.statusAfterCapture).toBe('ready');
});
