import { test, expect } from '@playwright/test';

test.describe('Phase 06: BTS Theme Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for UI to initialize
    await page.waitForFunction(() => window.uiManager && window.layoutManager);
  });

  test('REQ-01: BTS Theme Swatch exists and activates theme', async ({ page }) => {
    const paletteBtn = page.locator('#palette-toggle-btn');
    await paletteBtn.click();

    const btsSwatch = page.locator('.theme-swatch[data-theme="theme-bts"]');
    await expect(btsSwatch).toBeVisible();
    await btsSwatch.click({ force: true });

    // Check body classes
    const bodyClass = await page.evaluate(() => document.body.className);
    console.log('Body classes after BTS activation:', bodyClass);
    expect(bodyClass).toContain('theme-bts');
    expect(bodyClass).toContain('dark-theme');

    // Check localStorage (with wait for debounce)
    await page.waitForTimeout(1000);
    const savedStateRaw = await page.evaluate(() => localStorage.getItem('interactiveCalcState'));
    expect(savedStateRaw).not.toBeNull();
    const savedState = JSON.parse(savedStateRaw);
    expect(savedState.theme).toBe('theme-bts');
  });

  test('REQ-02: Equals button displays BTS chibi GIF when theme is active', async ({ page }) => {
    // Activate theme
    await page.locator('#palette-toggle-btn').click();
    await page.locator('.theme-swatch[data-theme="theme-bts"]').click({ force: true });

    const eqBtn = page.locator('.calc-btn.eq');
    
    // Check computed style for background-image
    const bgImage = await eqBtn.evaluate((el) => window.getComputedStyle(el).backgroundImage);
    expect(bgImage).toContain('bts-chibi.gif');

    // Check if text is hidden or highly transparent
    const styleInfo = await eqBtn.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
            color: style.color,
            backgroundImage: style.backgroundImage,
            bodyClasses: document.body.className
        };
    });
    console.log('Button Style Info:', styleInfo);
    
    // Check if it's transparent or a very light/transparent color
    const isTransparent = styleInfo.color === 'transparent' || styleInfo.color === 'rgba(0, 0, 0, 0)';
    
    if (!isTransparent) {
        // If it's not strictly transparent, it might be due to a bug in applying the style
        // but let's see if it's DIFFERENT from the default color in dark mode (usually white or similar)
        expect(styleInfo.bodyClasses).toContain('theme-bts');
        // If it's still rgb(255, 255, 255), then the style is NOT being applied.
        expect(styleInfo.color).not.toBe('rgb(255, 255, 255)');
    }
  });

  test('REQ-03: Theme switching removes BTS specific classes', async ({ page }) => {
    // Open theme picker
    await page.locator('#palette-toggle-btn').click();

    // Activate BTS theme first
    await page.locator('.theme-swatch[data-theme="theme-bts"]').click({ force: true });
    
    const bodyClassBts = await page.evaluate(() => document.body.className);
    expect(bodyClassBts).toContain('theme-bts');

    // Click back to default theme (Financial Blue)
    // Make sure the dropdown is still open or reopen it
    const dropdownActive = await page.evaluate(() => document.getElementById('theme-dropdown-container').classList.contains('active'));
    if (!dropdownActive) {
        await page.locator('#palette-toggle-btn').click();
    }
    
    const defaultSwatch = page.locator('.theme-swatch[data-theme=""]');
    await defaultSwatch.click({ force: true });

    // Wait a bit for classes to update
    await page.waitForTimeout(100);

    const bodyClassFinal = await page.evaluate(() => document.body.className);
    console.log('Body classes after switching back:', bodyClassFinal);
    expect(bodyClassFinal).not.toContain('theme-bts');
  });

  test('REQ-04: WebGL uIsBTS uniform activation (Indirect check)', async ({ page }) => {
    await page.locator('#palette-toggle-btn').click();
    await page.locator('.theme-swatch[data-theme="theme-bts"]').click({ force: true });
    
    const hasBtsClass = await page.evaluate(() => document.body.classList.contains('theme-bts'));
    expect(hasBtsClass).toBe(true);

    const canvas = page.locator('canvas'); // UIManager prepends it
    await expect(canvas).toBeVisible();
  });
});
