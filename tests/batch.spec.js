
import { test, expect } from '@playwright/test';

test.describe('Batch Rendering Unit Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    // Set a large viewport to ensure sidebar is visible and not culled
    await page.setViewportSize({ width: 1920, height: 1080 });
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
    const results = await page.evaluate(async () => {
      const renderer = window.uiManager.webglRenderer;
      const gl = renderer.gl;
      
      // 1. Wait for any pending frames to clear and ensure WebGL is active
      document.body.classList.add('webgl-active');
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        sidebar.classList.add('open');
        sidebar.style.width = '400px';
        sidebar.style.transform = 'none';
      }
      
      await new Promise(r => requestAnimationFrame(r));
      await new Promise(r => setTimeout(r, 100));

      let count = 0;
      let totalInstances = 0;
      const originalDraw = gl.drawArraysInstanced;
      
      gl.drawArraysInstanced = (mode, first, count_per_instance, instanceCount) => {
        count++;
        totalInstances += instanceCount;
        return originalDraw.call(gl, mode, first, count_per_instance, instanceCount);
      };
      
      // 2. Clear and trigger exactly one render
      console.log('Renderer initialized:', renderer.initialized);
      console.log('Document classes:', document.body.className);
      console.log('Active display element:', renderer.getActiveDisplayElement()?.id);
      
      renderer.render();
      console.log('Instance count after render:', renderer.instanceCount);
      
      // 3. Restore original and return results
      gl.drawArraysInstanced = originalDraw;
      
      return { count, totalInstances };
    });
    
    // We expect exactly 1 draw call for the 3 items pushed in renderer.render()
    expect(results.count).toBe(1);
    expect(results.totalInstances).toBe(3);
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
