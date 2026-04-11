import { test, expect } from '@playwright/test';

test.describe('Phase 5 Design System Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.calculator-svg', { state: 'attached' });

    // Open About Modal for testing its styles
    const aboutFabBtn = page.locator('#about-fab-btn');
    await aboutFabBtn.click();
    await page.waitForSelector('.about-overlay.open');
  });

  test('Typography Compliance', async ({ page }) => {
    const checkFontSize = async (selector, expectedPx, label) => {
      const fontSize = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? window.getComputedStyle(el).fontSize : 'NOT FOUND';
      }, selector);
      console.log(`${label} (${selector}) font-size:`, fontSize);
      if (fontSize === 'NOT FOUND')
        throw new Error(`${label} element not found`);
      // Expected values from UI-SPEC.md:
      // Heading: 20px (1.25rem), Body: 14px (0.875rem), Label: 12px (0.75rem), Display: 40px (2.5rem)
      expect(parseFloat(fontSize)).toBeCloseTo(expectedPx, 1);
    };

    // 1. Heading (20px) - Current: 1.2rem (19.2px)
    await checkFontSize('.about-header h2', 20, 'Heading');

    // 2. Body (14px) - Current: 0.82rem (13.12px)
    await checkFontSize('.about-intro', 14, 'Body');

    // 3. Label (12px) - Current: 0.72rem (11.52px)
    await checkFontSize('.about-section-title', 12, 'Label');

    // 4. Display (40px) - Current: 2.5rem (40px)
    await checkFontSize('.calc-current', 40, 'Display');
  });

  test('Spacing Scale Compliance (Multiples of 4)', async ({ page }) => {
    const isMultipleOf4 = (val) => {
      const num = parseFloat(val);
      return Math.abs(num % 4) < 0.1 || Math.abs((num % 4) - 4) < 0.1;
    };

    const aboutModalInnerPadding = await page.evaluate(() => {
      const el = document.querySelector('.about-modal-inner');
      const style = window.getComputedStyle(el);
      return {
        top: style.paddingTop,
        left: style.paddingLeft,
        right: style.paddingRight,
        bottom: style.paddingBottom,
      };
    });

    console.log('About Modal Inner Padding:', aboutModalInnerPadding);
    expect(
      isMultipleOf4(aboutModalInnerPadding.top),
      `Padding top ${aboutModalInnerPadding.top} should be multiple of 4`
    ).toBe(true);
    expect(
      isMultipleOf4(aboutModalInnerPadding.left),
      `Padding left ${aboutModalInnerPadding.left} should be multiple of 4`
    ).toBe(true);
    expect(
      isMultipleOf4(aboutModalInnerPadding.right),
      `Padding right ${aboutModalInnerPadding.right} should be multiple of 4`
    ).toBe(true);
    expect(
      isMultipleOf4(aboutModalInnerPadding.bottom),
      `Padding bottom ${aboutModalInnerPadding.bottom} should be multiple of 4`
    ).toBe(true);
  });

  test('Color Alpha Compliance (Alpha 0.45)', async ({ page }) => {
    // Force webgl-active class to trigger transparency CSS
    await page.evaluate(() => {
      document.body.classList.add('webgl-active');
    });

    // Wait for the background color to become semi-transparent (due to transition)
    await page.waitForFunction(
      () => {
        const el = document.querySelector('.calc-display');
        if (!el) return false;
        const color = window.getComputedStyle(el).backgroundColor;
        const parts = color.match(/[\d.]+/g);
        // We want alpha to be present (rgba) and around 0.45
        if (parts && parts.length === 4) {
          const alpha = parseFloat(parts[3]);
          return Math.abs(alpha - 0.45) < 0.1;
        }
        return false;
      },
      { timeout: 5000 }
    );

    const displayBG = await page.evaluate(() => {
      const el = document.querySelector('.calc-display');
      return window.getComputedStyle(el).backgroundColor;
    });

    console.log('Display Background:', displayBG);
    const parts = displayBG.match(/[\d.]+/g);
    const alpha = parts && parts.length === 4 ? parseFloat(parts[3]) : 1;

    // Requirement is 0.45.
    expect(alpha).toBeCloseTo(0.45, 1);
  });
});
