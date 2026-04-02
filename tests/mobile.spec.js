import { test, expect } from '@playwright/test';

test.describe('Mobile Touch & Context Loss Resilience (REQ-VER-03)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(500); 

        // Switch to WebGL-Only mode (mode 0) for Ghost DOM testing
        await page.evaluate(() => {
            while (window.uiManager && window.uiManager.parityMode !== 0) {
                window.uiManager.toggleParityMode();
            }
        });
        await page.waitForTimeout(500);
    });

    test('Touch interactions correctly trigger calculator actions via Ghost DOM', async ({ page }) => {
        // In WebGL-only mode, the canvas has pointer-events: none,
        // and the DOM buttons are fully transparent but clickable (Ghost DOM).
        
        // We will test Ghost DOM interaction by triggering click events
        // Ensure display starts at 0 or empty
        const initialDisplay = await page.locator('#main-calc-display').textContent();

        await page.click('button[data-value="7"]');
        await page.click('button[aria-label="Add"]');
        await page.click('button[data-value="8"]');
        await page.click('button[aria-label="Equals"]');

        const displayValue = await page.locator('#main-calc-display').textContent();
        expect(displayValue).toBe('15');
    });

    test('WebGL context loss and restoration works', async ({ page }) => {
        // Trigger WEBGL_lose_context extension
        await page.evaluate(() => {
            const canvas = document.getElementById('webgl-underlay');
            if (!canvas) return;
            
            const gl = canvas.getContext('webgl2');
            const ext = gl.getExtension('WEBGL_lose_context');
            if (ext) {
                window.__contextLostFired = false;
                window.__contextRestoredFired = false;
                
                canvas.addEventListener('webglcontextlost', () => { window.__contextLostFired = true; });
                canvas.addEventListener('webglcontextrestored', () => { window.__contextRestoredFired = true; });
                
                ext.loseContext();
                
                setTimeout(() => {
                    ext.restoreContext();
                }, 100);
            }
        });

        await page.waitForTimeout(500);

        // Verify that events were fired
        const contextEvents = await page.evaluate(() => {
            return {
                lost: window.__contextLostFired,
                restored: window.__contextRestoredFired
            };
        });

        expect(contextEvents.lost).toBe(true);
        expect(contextEvents.restored).toBe(true);

        // Verify app is still functional after context restoration
        await page.click('button[aria-label="Clear calculator"]');
        await page.click('button[data-value="9"]');
        await page.click('button[aria-label="Equals"]');
        
        const displayValue = await page.locator('#main-calc-display').textContent();
        expect(displayValue).toBe('9');
    });
});