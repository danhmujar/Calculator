import { test, expect } from '@playwright/test';

test.describe('Mobile WebGL Markers', () => {
    test.beforeEach(async ({ page }) => {
        // Set mobile viewport (width <= 1024px)
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('http://localhost:5173');
    });

    test('WebGL markers are tracked correctly when the drawer is open on mobile', async ({ page }) => {
        // 1. Verify markers initially hidden or not on display
        const initialTracking = await page.evaluate(() => {
            const renderer = window.uiManager.webglRenderer;
            return {
                target: renderer.getActiveDisplayElement()?.id,
                isOpen: document.getElementById('sidebar')?.classList.contains('open')
            };
        });
        
        // 2. Open the drawer
        await page.click('#mobile-panel-toggle-btn');

        // Wait for animation to finish
        await page.waitForTimeout(500);

        // 3. Verify markers are tracked
        const drawerOpenTracking = await page.evaluate(() => {
            const renderer = window.uiManager.webglRenderer;
            const target = renderer.getActiveDisplayElement();
            const rect = target?.getBoundingClientRect();

            return {
                targetId: target?.id,
                isOpen: document.getElementById('sidebar')?.classList.contains('open'),
                rect: rect ? { x: rect.left, y: rect.top, width: rect.width, height: rect.height } : null,
                isOffscreen: rect ? (rect.right < -10 || rect.left > window.innerWidth + 10) : true,
                bodyHasClass: document.body.classList.contains('webgl-active')
            };
        });

        expect(drawerOpenTracking.isOpen).toBe(true);
        expect(drawerOpenTracking.targetId).toBe('main-calc-display');
        expect(drawerOpenTracking.rect).not.toBeNull();
        expect(drawerOpenTracking.isOffscreen).toBe(false);
        expect(drawerOpenTracking.bodyHasClass).toBe(true);
    });

    test('Mobile drawer has semi-transparent background when WebGL is active', async ({ page }) => {
        // Ensure webgl is active
        const bgStyle = await page.evaluate(() => {
            const sidebar = document.getElementById('sidebar');
            const style = window.getComputedStyle(sidebar);
            return {
                backgroundColor: style.backgroundColor,
                backdropFilter: style.backdropFilter || style.webkitBackdropFilter
            };
        });

        // The background color should be semi-transparent (contains alpha)
        // Accepts rgba() or color(srgb ... / alpha)
        expect(bgStyle.backgroundColor).toMatch(/(rgba?\(\d+,\s*\d+,\s*\d+,\s*0\.\d+\)|color\(srgb.*\/.*0\.\d+\))/);
    });
});
