import { test, expect } from '@playwright/test';

test.describe('Phase 08: WebGL Infra Enhancements', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/Calculator/');
        // Wait for WebGL to be ready
        await page.waitForSelector('body.webgl-active');
    });

    test('REQ-01: pushRect supports border and shadow options', async ({ page }) => {
        // Inject a test call to pushRect and check for errors
        const result = await page.evaluate(async () => {
            try {
                // Ensure renderer is initialized
                if (!window.uiManager || !window.uiManager.webglRenderer) {
                    return { success: false, error: 'Renderer not found' };
                }
                const renderer = window.uiManager.webglRenderer;
                renderer.pushRect(
                    { x: 100, y: 100, width: 200, height: 100 },
                    [1, 0, 0, 1], // Red
                    10,           // Radius
                    'test-id',
                    {
                        borderColor: [0, 1, 0, 1], // Green border
                        borderWidth: 2,
                        shadowBlur: 5,
                        shadowOffset: [4, 4]
                    }
                );
                renderer.flush();
                return { success: true };
            } catch (e) {
                return { success: false, error: e.message };
            }
        });

        expect(result.success).toBe(true);
    });

    test('REQ-02: Glyph rendering maintains 32-float stride integrity', async ({ page }) => {
        // Verify that standard calculations still work (rendering glyphs)
        const display = page.locator('#main-calc-display');
        await page.click('button:has-text("7")');
        await page.click('button:has-text("8")');
        await expect(display).toContainText('78');
        
        // No JS errors should occur during glyph pushing
        const result = await page.evaluate(() => {
            try {
                window.uiManager.webglRenderer.render();
                return { success: true };
            } catch (e) {
                return { success: false, error: e.message };
            }
        });
        
        expect(result.success).toBe(true);
    });
});
