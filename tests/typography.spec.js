import { test, expect } from '@playwright/test';

test.describe('Typography Layout Extraction', () => {
    test.beforeEach(async ({ page }) => {
        // Go to the main application page
        await page.goto('http://localhost:5173');
        // Activate scientific mode to ensure math-fields are available
        await page.click('#btn-mode-sci');
        await page.waitForSelector('math-field');
    });

    test('TypographyManager extracts glyphs from MathLive shadow DOM', async ({ page }) => {
        const glyphs = await page.evaluate(async () => {
            const mf = document.querySelector('math-field');
            // We set a simple value to test extraction
            mf.value = '1+2';
            
            // Wait a frame for MathLive to render
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            // We assume TypographyManager will be available on window or imported
            // For now, we'll check if the module can be loaded and used
            const { TypographyManager } = await import('/Calculator/ui/webgl/typography.js');
            const manager = new TypographyManager();
            return manager.extractGlyphs(mf);
        });
        
        expect(Array.isArray(glyphs)).toBe(true);
        expect(glyphs.length).toBeGreaterThan(0);
        
        // Check for specific glyphs for '1+2'
        const chars = glyphs.map(g => g.char);
        expect(chars).toContain('1');
        expect(chars).toContain('+');
        expect(chars).toContain('2');

        // Check metadata structure
        const glyph = glyphs[0];
        expect(glyph).toHaveProperty('char');
        expect(glyph).toHaveProperty('font');
        expect(glyph).toHaveProperty('x');
        expect(glyph).toHaveProperty('y');
        expect(glyph).toHaveProperty('width');
        expect(glyph).toHaveProperty('height');
        
        // Coordinates should be numbers
        expect(typeof glyph.x).toBe('number');
        expect(typeof glyph.y).toBe('number');
    });

    test('TypographyManager syncs on MathLive input events', async ({ page }) => {
        await page.waitForSelector('math-field');

        const syncResult = await page.evaluate(async () => {
            const mf = document.querySelector('math-field');
            const { TypographyManager } = await import('/Calculator/ui/webgl/typography.js');
            const manager = new TypographyManager();
            
            let updateCount = 0;
            manager.onLayoutUpdate(() => {
                updateCount++;
            });

            // Trigger an input event
            mf.value = 'x^2';
            mf.dispatchEvent(new Event('input', { bubbles: true }));

            // Wait for batched update (requestAnimationFrame)
            await new Promise(resolve => requestAnimationFrame(resolve));
            await new Promise(resolve => requestAnimationFrame(resolve));

            return {
                updateCount,
                glyphCount: manager.getVisibleGlyphs().length
            };
        });

        expect(syncResult.updateCount).toBeGreaterThan(0);
        expect(syncResult.glyphCount).toBeGreaterThan(0);
    });
});
