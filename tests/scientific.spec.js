import { test, expect } from '@playwright/test';

test.describe('Scientific Mode: Lazy Loading & MathLive', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/Calculator/');
        await page.waitForSelector('#main-calc-display');
    });

    test('Scientific 1: MathLive is lazy-loaded on mode switch', async ({ page }) => {
        // Initially MathLive should NOT be loaded (checking window.MathfieldElement)
        let isMathLiveLoaded = await page.evaluate(() => !!window.MathfieldElement);
        expect(isMathLiveLoaded).toBe(false);

        // Switch to scientific mode
        await page.click('#btn-mode-sci');

        // Wait for Mathfield to appear (indicating loading + initialization)
        await page.waitForSelector('math-field', { timeout: 10000 });

        // Confirm MathLive is now loaded
        isMathLiveLoaded = await page.evaluate(() => !!window.MathfieldElement);
        expect(isMathLiveLoaded).toBe(true);
    });

    test('Scientific 2: MathLive evaluations work with Math.js', async ({ page }) => {
        await page.click('#btn-mode-sci');
        const mf = page.locator('math-field');
        await mf.waitFor();

        // Type "2+2" into math-field
        // MathLive's math-field might need special handling for typing
        await mf.evaluate(el => el.value = '2+2');
        // Trigger input event to start evaluation
        await mf.evaluate(el => el.dispatchEvent(new Event('input', { bubbles: true })));

        // Result should be "= 4"
        const result = page.locator('.math-result').first();
        await expect(result).toHaveText('= 4');
    });

    test('Scientific 3: Complex expressions (Math.js robustness)', async ({ page }) => {
        await page.click('#btn-mode-sci');
        const mf = page.locator('math-field');
        await mf.waitFor();

        // sqrt(144) * 2
        await mf.evaluate(el => el.value = '\\sqrt{144} \\cdot 2');
        await mf.evaluate(el => el.dispatchEvent(new Event('input', { bubbles: true })));

        const result = page.locator('.math-result').first();
        await expect(result).toHaveText('= 24');
    });
});
