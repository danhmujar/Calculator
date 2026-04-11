import { test, expect } from '@playwright/test';

test.describe.skip('Theme FPS Comparison', () => {
  // Set timeout to 2.5 minutes to accommodate two 1-minute measurements + buffer
  test.setTimeout(150000);

  const measureFPS = async (page, durationMs) => {
    return await page.evaluate(async (duration) => {
      return new Promise((resolve) => {
        let frames = 0;
        let startTime = 0;
        
        const loop = (timestamp) => {
          if (frames === 0) {
            startTime = timestamp;
          }
          frames++;
          
          if (timestamp - startTime < duration) {
            requestAnimationFrame(loop);
          } else {
            const elapsed = timestamp - startTime;
            const fps = (frames / (elapsed / 1000));
            resolve(fps);
          }
        };
        
        requestAnimationFrame(loop);
      });
    }, durationMs);
  };

  test('Compare FPS: Normal (Teal) vs Aurora', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.calculator-svg', { state: 'attached' });
    await page.waitForFunction(() => window.uiManager);

    const testDuration = 60000; // 1 minute in milliseconds

    console.log('--- Starting FPS Measurement ---');

    // 1. Measure Normal Theme
    console.log('Measuring Normal Theme (theme-teal) for 60 seconds...');
    await page.evaluate(() => {
      const swatch = document.querySelector('.theme-swatch[data-theme="theme-teal"]');
      if (swatch) window.uiManager.setThemeColor(swatch, 'theme-teal');
    });
    
    // Give the theme time to settle
    await page.waitForTimeout(2000); 

    const normalFPS = await measureFPS(page, testDuration);
    console.log(`> Normal Theme FPS: ${normalFPS.toFixed(2)}`);

    // 2. Measure Aurora Theme
    console.log('Measuring Aurora Theme (theme-aurora) for 60 seconds...');
    await page.evaluate(() => {
      const swatch = document.querySelector('.theme-swatch[data-theme="theme-aurora"]');
      if (swatch) window.uiManager.setThemeColor(swatch, 'theme-aurora');
    });
    
    // Give the WebGL shaders and CSS animations time to fully start
    await page.waitForTimeout(2000); 

    const auroraFPS = await measureFPS(page, testDuration);
    console.log(`> Aurora Theme FPS: ${auroraFPS.toFixed(2)}`);
    
    console.log('--- FPS Measurement Complete ---');
    console.log(`Difference: ${Math.abs(normalFPS - auroraFPS).toFixed(2)} FPS`);
    
    // We don't strictly need an expect here since we are just measuring,
    // but we can ensure it completed successfully.
    expect(normalFPS).toBeGreaterThan(0);
    expect(auroraFPS).toBeGreaterThan(0);
  });
});
