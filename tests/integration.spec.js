import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('E2E Integration: Store -> Renderer -> UI', () => {
    test.beforeEach(async ({ page }) => {
        // Load the actual application
        await page.goto('http://localhost:5173/Calculator/');
        await page.waitForSelector('#main-calc-display');
    });

    test('Integration 1: Keypad click updates store and reflects in UI via Renderer', async ({ page }) => {
        const display = page.locator('#main-calc-display');
        
        // Initial state
        await expect(display).toHaveText('0');

        // Click '7'
        await page.click('button[data-value="7"]');
        
        // Renderer should batch this and update display
        await expect(display).toHaveText('7');

        // Click '8'
        await page.click('button[data-value="8"]');
        await expect(display).toHaveText('78');

        // Verify font size is still at max (2.5rem) for short text
        const fontSize = await display.evaluate(el => window.getComputedStyle(el).fontSize);
        // 2.5rem * 16px = 40px
        expect(parseFloat(fontSize)).toBeCloseTo(40, 0);
    });

    test('Integration 2: Long input triggers font scaling via Renderer', async ({ page }) => {
        const display = page.locator('#main-calc-display');
        
        // Type a long number (15 digits) via keyboard to avoid viewport issues
        for (let i = 0; i < 15; i++) {
            await page.keyboard.press('9');
        }
        
        // Wait for text to appear
        await expect(display).not.toHaveText('0');

        // Force a very narrow width and re-trigger update
        await display.evaluate(el => {
            el.parentElement.style.width = '80px';
            el.parentElement.style.minWidth = '80px';
            el.parentElement.style.maxWidth = '80px';
        });
        
        // Trigger one more update to re-evaluate with narrow width
        await page.keyboard.press('9');
        
        // Wait for Renderer's rAF flush
        await page.waitForTimeout(200);

        const fontSize = await display.evaluate(el => window.getComputedStyle(el).fontSize);
        const text = await display.textContent();
        console.log(`UAT-04 Debug: Text="${text}", FontSize="${fontSize}"`);
        
        expect(parseFloat(fontSize)).toBeLessThan(40);
    });

    test('Integration 3: State persists across reloads via Store + LocalStorage', async ({ page }) => {
        // Clear localStorage first to be sure
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Set a value
        await page.click('button[data-value="5"]');
        await page.click('button[data-value="2"]');
        await expect(page.locator('#main-calc-display')).toHaveText('52');

        // Wait for debounce (500ms)
        await page.waitForTimeout(600);

        // Reload page
        await page.reload();
        await page.waitForSelector('#main-calc-display');

        // Should restore '52'
        await expect(page.locator('#main-calc-display')).toHaveText('52');
    });
});
