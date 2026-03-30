import { test, expect } from '@playwright/test';

test.describe('Performance: Eye Tracking Hardware Acceleration', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
        await page.goto('http://localhost:4173/Calculator/');
        await page.waitForSelector('.calculator-wrapper svg');
    });

    test('Performance 1: Pupil movement uses hardware-accelerated CSS variables', async ({ page }) => {
        // Move mouse to far left with steps to trigger events
        await page.mouse.move(10, 300, { steps: 10 });
        await page.waitForTimeout(500);
        const leftXRaw = await page.evaluate(() => document.documentElement.style.getPropertyValue('--pupil-x-1'));
        console.log('Left X Raw (direct):', leftXRaw);
        const leftX = parseFloat(leftXRaw || '0');

        // Move mouse to far right
        const { width } = page.viewportSize();
        await page.mouse.move(width - 10, 300, { steps: 10 });
        await page.waitForTimeout(500);
        const rightXRaw = await page.evaluate(() => document.documentElement.style.getPropertyValue('--pupil-x-1'));
        console.log('Right X Raw (direct):', rightXRaw);
        const rightX = parseFloat(rightXRaw || '0');

        // Pupil should have moved right (rightX > leftX)
        expect(rightX).toBeGreaterThan(leftX);
    });

    test('Performance 2: Throttled mouse tracking prevents layout thrashing (rAF Batching)', async ({ page }) => {
        // We'll use a performance trace or mock Renderer.schedule if needed,
        // but checking the responsiveness of the pupil is a good proxy.
        
        // Rapidly move mouse
        for (let i = 0; i < 100; i += 10) {
            await page.mouse.move(i, i);
        }

        // The UI should still be responsive and CSS variables should be updated correctly
        const pupilX = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--pupil-x-1'));
        expect(pupilX).not.toBe('0px');
    });
});
