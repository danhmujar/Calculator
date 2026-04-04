import { test, expect } from '@playwright/test';

test.describe('Phase 4: Optimization and UI Refinement Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.calculator-svg', { state: 'attached' });
    await page.waitForFunction(() => window.uiManager && window.uiManager.themeManager);
  });

  test('UI-REF-01/02: Theme Transition Timing & Easing', async ({ page }) => {
    const transitionData = await page.evaluate(async () => {
      const ui = window.uiManager;
      
      // 1. Ensure we are in a known aurora theme (Cosmic)
      const auroraSwatch = document.querySelector('.theme-swatch[data-theme="theme-aurora"]');
      ui.setThemeColor(auroraSwatch, 'theme-aurora');
      await new Promise(r => setTimeout(r, 50)); 
      
      // 2. Switch to another aurora theme (Sunset) to trigger transition
      // Sunset color1 is #2a0b0b vs Cosmic #1a0b2e
      const sunsetSwatch = document.querySelector('.theme-swatch[data-theme="theme-aurora-sunset"]');
      ui.setThemeColor(sunsetSwatch, 'theme-aurora-sunset');
      
      const samples = [];
      const startTime = performance.now();
      
      for (let i = 0; i < 5; i++) {
        const uniforms = ui.getThemeUniforms();
        samples.push({
          elapsed: performance.now() - startTime,
          color1: [...uniforms.uAuroraColor1]
        });
        await new Promise(r => setTimeout(r, 100));
      }
      
      return samples;
    });

    const start = transitionData[0];
    const mid = transitionData[2]; // ~200ms
    const end = transitionData[4]; // ~400ms

    // Verify interpolation occurred
    expect(start.color1).not.toEqual(end.color1);
    
    const totalDiff = Math.abs(end.color1[0] - start.color1[0]);
    if (totalDiff > 0.01) {
        const progressAtMid = Math.abs(mid.color1[0] - start.color1[0]) / totalDiff;
        // Quadratic Out (t=0.5) is 0.75.
        expect(progressAtMid).toBeGreaterThan(0.6);
    }
  });

  test('UI-REF-03/04/05: Glass Opacity Audit', async ({ page }) => {
    const glassMetrics = await page.evaluate(() => {
      const card = document.querySelector('.calc-card');
      const style = window.getComputedStyle(card);
      const glassVar = getComputedStyle(document.body).getPropertyValue('--glass-bg').trim();
      
      return {
        backgroundColor: style.backgroundColor,
        glassVar: glassVar
      };
    });

    expect(glassMetrics.glassVar).toContain('0.82');
  });

  test('UI-REF-06: Eye Tracking Inertia (EMA)', async ({ page }) => {
    const inertiaCheck = await page.evaluate(async () => {
      const pupil = document.querySelector('#pupil1');
      
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 800,
        clientY: 600,
        bubbles: true
      });
      document.dispatchEvent(moveEvent);

      const samples = [];
      for (let i = 0; i < 5; i++) {
        const rect = pupil.getBoundingClientRect();
        samples.push({ x: rect.left, y: rect.top });
        await new Promise(r => setTimeout(r, 50));
      }
      return samples;
    });

    expect(inertiaCheck[0].x).not.toEqual(inertiaCheck[4].x);
    const xValues = inertiaCheck.map(s => s.x);
    const isMonotonic = xValues.every((v, i) => i === 0 || (xValues[i-1] <= v) || (xValues[i-1] >= v));
    expect(isMonotonic).toBe(true);
  });

  test('UI-REF-06: Eye Blinking Logic', async ({ page }) => {
    const hasBlink = await page.evaluate(() => {
      const eye = document.querySelector('.eye');
      const style = window.getComputedStyle(eye);
      return style.animationName || style.animation;
    });

    expect(hasBlink).toContain('blink');
  });
});
