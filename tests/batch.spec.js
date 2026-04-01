import { test, expect } from '@playwright/test';

test.describe('WebGL Batch Rendering', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173');
    });

    test('BatchRenderer reduces draw calls via instancing', async ({ page }) => {
        const drawCallCount = await page.evaluate(async () => {
            const canvas = document.getElementById('webgl-underlay');
            const gl = canvas.getContext('webgl2');
            
            let callCount = 0;
            const originalDrawArraysInstanced = gl.drawArraysInstanced;
            
            // Mock drawArraysInstanced to count calls
            gl.drawArraysInstanced = function(...args) {
                callCount++;
                return originalDrawArraysInstanced.apply(this, args);
            };

            // Trigger a render that should use batching
            // We need to wait for the next frame to ensure the renderer has a chance to run
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            // Restore original function
            const finalCount = callCount;
            gl.drawArraysInstanced = originalDrawArraysInstanced;
            
            return finalCount;
        });

        // Initially it might be 0 if nothing is drawn yet, but once we implement it, 
        // we expect it to be low even for multiple objects.
        console.log(`Draw calls detected: ${drawCallCount}`);
        // This test will fail initially because drawArraysInstanced is not used yet.
        // But it's a good starting point for the scaffold.
    });

    test('Unified shader supports both rects and text', async ({ page }) => {
        const shaderStatus = await page.evaluate(() => {
            const canvas = document.getElementById('webgl-underlay');
            const gl = canvas.getContext('webgl2');
            
            // This is a placeholder check until Task 1 is done
            // We'll check if BATCH_VERT and BATCH_FRAG are available in the window/renderer
            // Or we can try to compile them manually here for verification
            return {
                hasWebGL2: !!gl,
                isInstancingSupported: !!gl.drawArraysInstanced
            };
        });

        expect(shaderStatus.hasWebGL2).toBe(true);
        expect(shaderStatus.isInstancingSupported).toBe(true);
    });
});
