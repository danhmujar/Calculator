import { test, expect } from '@playwright/test';

test.describe('WebGL Rendering Engine', () => {
    test.beforeEach(async ({ page }) => {
        // Go to the main application page
        await page.goto('http://localhost:5173');
    });

    test('WebGL 2.0 context is initialized and available', async ({ page }) => {
        const glInfo = await page.evaluate(() => {
            const canvas = document.getElementById('webgl-underlay');
            if (!canvas) return { error: 'Canvas not found' };
            
            const gl = canvas.getContext('webgl2');
            if (!gl) return { error: 'WebGL 2.0 context not available' };
            
            const version = gl.getParameter(gl.VERSION);
            const renderer = gl.getParameter(gl.RENDERER);
            const vendor = gl.getParameter(gl.VENDOR);
            
            return {
                isContextAvailable: !!gl,
                version,
                renderer,
                vendor,
                canvasWidth: canvas.width,
                canvasHeight: canvas.height
            };
        });

        if (glInfo.error) {
            console.error('WebGL Test Error:', glInfo.error);
            throw new Error(glInfo.error);
        }

        console.log('WebGL Info:', JSON.stringify(glInfo, null, 2));
        expect(glInfo.isContextAvailable).toBe(true);
        // Relax version check for environments where getParameter might return null (e.g. some headless setups)
        if (glInfo.version === null) {
            console.warn('WebGL version is null, but context exists.');
        } else {
            expect(glInfo.version).toContain('WebGL 2.0');
        }
    });

    test('Canvas follows the Underlay Pattern', async ({ page }) => {
        const layoutInfo = await page.evaluate(() => {
            const container = document.querySelector('.layout-container');
            if (!container) return { error: 'Layout container not found' };
            
            const canvas = document.getElementById('webgl-underlay');
            if (!canvas) return { error: 'Canvas not found' };
            
            const style = window.getComputedStyle(canvas);
            const isFirstChild = container.firstElementChild === canvas;
            
            return {
                isFirstChild,
                position: style.position,
                zIndex: style.zIndex,
                pointerEvents: style.pointerEvents
            };
        });

        if (layoutInfo.error) {
            throw new Error(layoutInfo.error);
        }

        expect(layoutInfo.isFirstChild).toBe(true);
        expect(layoutInfo.position).toBe('fixed');
        expect(layoutInfo.zIndex).toBe('-1');
        expect(layoutInfo.pointerEvents).toBe('none');
    });
});
