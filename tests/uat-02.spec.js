import { test, expect } from '@playwright/test';

test('UAT-02: Scientific Mode Expression Evaluation', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('#main-calc-display');

    // Toggle SCI mode
    await page.click('#btn-mode-sci');
    
    // Wait for libraries to load
    await page.waitForTimeout(2000); 

    // Find math-field
    const mf = page.locator('math-field');
    await expect(mf).toBeVisible();

    // Type "sqrt(16)"
    // MathLive might require specific input methods, but typing might work
    await mf.focus();
    await page.keyboard.type('sqrt(16)');
    
    // Check result
    const result = page.locator('.math-result');
    await expect(result).toHaveText(/= 4/);
});
