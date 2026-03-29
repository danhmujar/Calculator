import { test, expect } from '@playwright/test';

/**
 * UAT-02: Scientific Mode Expression Evaluation
 * Verifies that mathjs and mathlive are correctly bundled and functional.
 */
test('UAT-02: Scientific Mode Expression Evaluation', async ({ page }) => {
    await page.goto('http://localhost:4173/Calculator/');
    await page.waitForSelector('#main-calc-display');

    // Toggle SCI mode
    await page.click('#btn-mode-sci');
    
    // Wait for libraries to load
    await page.waitForTimeout(2000); 

    // Find math-field
    const mf = page.locator('math-field');
    await expect(mf).toBeVisible();

    // Type "sqrt(16)"
    await mf.focus();
    await page.keyboard.type('sqrt(16)');
    
    // Check result
    const result = page.locator('.math-result');
    await expect(result).toHaveText(/= 4/);
});

/**
 * UAT-02: Offline Mode Support
 * Verifies that the Service Worker is correctly registered and handles offline navigation.
 */
test('UAT-02: Offline Mode Support', async ({ context, page }) => {
    await page.goto('http://localhost:4173/Calculator/');
    
    // Wait for Service Worker to be ready and control the page
    await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.ready;
        if (!navigator.serviceWorker.controller) {
            await new Promise(resolve => {
                navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
            });
        }
    });

    // Go offline
    await context.setOffline(true);
    
    // Reload page
    await page.reload();
    
    // Check if app still loads
    await page.waitForSelector('#main-calc-display');
    const title = await page.title();
    expect(title).toContain('Calculator');

    // Basic calculation offline
    await page.click('button[data-value="5"]');
    await page.click('button[data-action="op"][data-value="*"]');
    await page.click('button[data-value="6"]');
    await page.click('button[data-action="equals"]');
    
    const display = page.locator('#main-calc-display');
    await expect(display).toHaveText('30');
    
    // Restore online state
    await context.setOffline(false);
});
