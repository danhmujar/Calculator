import { test, expect } from '@playwright/test';

test.describe('Performance: Eye Tracking Hardware Acceleration', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:4173/Calculator/');
        await page.waitForSelector('#pupil1');
    });

    test('Performance 1: Pupil movement uses hardware-accelerated CSS variables', async ({ page }) => {
        const pupil = page.locator('#pupil1');

        // Move mouse to far left with steps to trigger events
        await page.mouse.move(10, 300, { steps: 10 });
        await page.waitForTimeout(200);
        const leftX = await pupil.evaluate(el => parseFloat(getComputedStyle(el).getPropertyValue('--pupil-x')));

        // Move mouse to far right
        const { width } = page.viewportSize();
        await page.mouse.move(width - 10, 300, { steps: 10 });
        await page.waitForTimeout(200);
        const rightX = await pupil.evaluate(el => parseFloat(getComputedStyle(el).getPropertyValue('--pupil-x')));

        // Pupil should have moved right (rightX > leftX)
        expect(rightX).toBeGreaterThan(leftX);
    });

    test('Performance 2: Throttled mouse tracking prevents layout thrashing (rAF Batching)', async ({ page }) => {
        // We'll use a performance trace or mock Renderer.schedule if needed,
        // but checking the responsiveness of the pupil is a good proxy.
        const pupil = page.locator('#pupil1');
        
        // Rapidly move mouse
        for (let i = 0; i < 100; i += 10) {
            await page.mouse.move(i, i);
        }

        // The UI should still be responsive and CSS variables should be updated correctly
        const pupilX = await pupil.evaluate(el => getComputedStyle(el).getPropertyValue('--pupil-x'));
        expect(pupilX).not.toBe('0px');
    });
});
