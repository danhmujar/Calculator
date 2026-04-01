import { test, expect } from '@playwright/test';

test.describe('GPU Animation Interpolation UAT (09-04)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/Calculator/');
        // Ensure WebGL is active
        await page.evaluate(() => document.body.classList.add('webgl-active'));
    });

    test('Batch Vertex Shader contains interpolation attributes and logic', async ({ page }) => {
        const shaderData = await page.evaluate(async () => {
            const { BATCH_VERT } = await import('./ui/webgl/shaders.js');
            return { vert: BATCH_VERT };
        });
        
        expect(shaderData.vert).toContain('a_startRect');
        expect(shaderData.vert).toContain('a_endRect');
        expect(shaderData.vert).toContain('a_startColor');
        expect(shaderData.vert).toContain('a_endColor');
        expect(shaderData.vert).toContain('a_transition');
        expect(shaderData.vert).toContain('quadraticOut');
        expect(shaderData.vert).toContain('mix(a_startRect, a_endRect, easedT)');
    });

    test('Renderer.getTransitionData calculates seamless starts correctly', async ({ page }) => {
        const result = await page.evaluate(async () => {
            try {
                const { WebGLContext } = await import('./ui/webgl/context.js');
                const { WebGLRenderer } = await import('./ui/webgl/renderer.js');
                
                const canvas = document.createElement('canvas');
                const ctx = new WebGLContext(canvas);
                const renderer = new WebGLRenderer(ctx);
                
                const id = 'test-anim';
                const startRect = { x: 0, y: 0, width: 100, height: 100 };
                const endRect = { x: 200, y: 200, width: 100, height: 100 };
                const color = [1, 0, 0, 1];
                
                // 1. Initial push (instant)
                renderer.getTransitionData(id, startRect, color, 0); 
                
                // 2. Trigger animation to endRect
                const trans1 = renderer.getTransitionData(id, endRect, color, 1000);
                
                // Verify initial animation setup
                const initialStart = { ...trans1.startRect };
                
                // 3. Wait a bit (simulate time passing)
                // Since we can't easily wait in evaluate for shader time, 
                // we'll mock the internal behavior if needed, but here we'll 
                // just trigger a second mid-animation change.
                
                // Force a "now" in history to simulate mid-way
                const history = renderer.layoutHistory.get(id);
                history.startTime = (performance.now() / 1000.0) - 0.5; // Started 0.5s ago
                history.duration = 1.0; // 1s duration
                
                // New target mid-way
                const midTarget = { x: 500, y: 500, width: 100, height: 100 };
                const trans2 = renderer.getTransitionData(id, midTarget, color, 1000);
                
                // In quadraticOut(0.5) = 0.5 * (2 - 0.5) = 0.5 * 1.5 = 0.75
                // x should be 0 + (200 - 0) * 0.75 = 150
                
                return {
                    initialStart,
                    seamlessStart: trans2.startRect,
                    newEnd: trans2.endRect,
                    error: null
                };
            } catch (e) {
                return { error: e.stack };
            }
        });

        if (result.error) console.error(result.error);
        expect(result.error).toBeNull();
        expect(result.initialStart.x).toBe(0);
        // Seamless start should be roughly 150 (depending on performance.now() jitter)
        expect(result.seamlessStart.x).toBeGreaterThan(140);
        expect(result.seamlessStart.x).toBeLessThan(160);
        expect(result.newEnd.x).toBe(500);
    });

    test('Renderer.pushRect correctly maps attributes to instance buffer', async ({ page }) => {
        const result = await page.evaluate(async () => {
             const { WebGLContext } = await import('./ui/webgl/context.js');
             const { WebGLRenderer } = await import('./ui/webgl/renderer.js');
             
             const canvas = document.createElement('canvas');
             const ctx = new WebGLContext(canvas);
             const renderer = new WebGLRenderer(ctx);
             
             const rect = { x: 10, y: 20, width: 30, height: 40 };
             const color = [0.1, 0.2, 0.3, 1.0];
             renderer.pushRect(rect, color, 5);
             
             // Check first 24 floats
             const data = renderer.instanceData.subarray(0, 24);
             const dpr = window.devicePixelRatio || 1;
             
             return {
                 x: data[0],
                 y: data[1],
                 w: data[2],
                 h: data[3],
                 endX: data[4],
                 r: data[8],
                 type: data[22],
                 radius: data[23],
                 dpr
             };
        });
        
        expect(result.x).toBe(10 * result.dpr);
        expect(result.y).toBe(20 * result.dpr);
        expect(result.w).toBe(30 * result.dpr);
        expect(result.h).toBe(40 * result.dpr);
        expect(result.endX).toBe(10 * result.dpr); // Instant push means start == end
        expect(result.r).toBeCloseTo(0.1);
        expect(result.type).toBe(0.0); // 0 = Rect
        expect(result.radius).toBe(5 * result.dpr);
    });
});
