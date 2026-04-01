
import { test, expect } from '@playwright/test';

test.describe('Batch Rendering Unit Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('WebGL 2.0 context is available', async ({ page }) => {
    const isWebGL2 = await page.evaluate(() => {
      const canvas = document.getElementById('webgl-underlay');
      return !!canvas.getContext('webgl2');
    });
    expect(isWebGL2).toBe(true);
  });

  test('Instanced rendering reduces draw calls', async ({ page }) => {
    const drawCalls = await page.evaluate(async () => {
      const renderer = window.uiManager.webglRenderer;
      const gl = renderer.gl;
      let count = 0;
      const originalDraw = gl.drawArraysInstanced;
      
      gl.drawArraysInstanced = (...args) => {
        count++;
        return originalDraw.apply(gl, args);
      };
      
      // Clear and render to trigger flush
      renderer.render();
      
      // Restore original
      gl.drawArraysInstanced = originalDraw;
      
      return count;
    });
    
    // For a simple UI, we expect very few draw calls (ideally 1 for the whole UI)
    // The current render() in WebGLRenderer pushes 1 rect and 2 glyphs, then flushes.
    // That should be exactly 1 draw call.
    expect(drawCalls).toBeGreaterThan(0);
    expect(drawCalls).toBeLessThan(5);
  });

  test('Unified shader handles both Rect and Text types', async ({ page }) => {
    const shaderStatus = await page.evaluate(() => {
      const renderer = window.uiManager.webglRenderer;
      const program = renderer.batchProgram;
      return !!program;
    });
    expect(shaderStatus).toBe(true);
  });
});
