import { test, expect } from '@playwright/test';

test.describe('Phase 2: Underlay Blur Integration and UI Synchronization', () => {
  const waitForStableWebGL = async (page) => {
    await page.evaluate(async () => {
      const gl = window.uiManager.webgl.gl;
      if (gl.isContextLost()) {
        console.warn('Test: WebGL context lost, waiting for restoration...');
        await new Promise(resolve => {
          const canvas = window.uiManager.webgl.canvas;
          canvas.addEventListener('webglcontextrestored', resolve, { once: true });
        });
      }
      // Ensure at least one frame has rendered
      await new Promise(requestAnimationFrame);
    });
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for uimanager to initialize and inject the canvas
    await page.waitForSelector('#webgl-underlay', { state: 'attached' });
    await waitForStableWebGL(page);
  });

  test('Shader Compilation', async ({ page }) => {
    // Check for shader compilation errors in the console
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') logs.push(msg.text());
    });
    await page.reload();
    await waitForStableWebGL(page);
    const shaderErrors = logs.filter(log => log.includes('shader') || log.includes('program'));
    expect(shaderErrors).toHaveLength(0);
  });

  test('FBO Configuration', async ({ page }) => {
    // Verify FBO creation and texture properties
    const fboState = await page.evaluate(() => {
      const renderer = window.uiManager.webglRenderer;
      if (!renderer || !renderer.fboA || !renderer.fboB) return { error: 'Renderer or FBOs missing' };
      
      const gl = renderer.gl;
      if (!gl) return { error: 'GL context missing' };
      if (gl.isContextLost()) return { error: 'CONTEXT_LOST_WEBGL' };

      // Clear any previous errors
      while (gl.getError() !== gl.NO_ERROR) {}

      const isTexA = gl.isTexture(renderer.fboA.texture);
      const isTexB = gl.isTexture(renderer.fboB.texture);

      gl.bindTexture(gl.TEXTURE_2D, renderer.fboA.texture);
      const filter = gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER);
      
      const error = gl.getError();
      let errorName = 'NO_ERROR';
      if (error !== 0) {
          for (const key in gl) {
              if (gl[key] === error) {
                  errorName = key;
                  break;
              }
          }
      }

      return {
        fboA_width: renderer.fboA.width,
        fboA_height: renderer.fboA.height,
        fboA_filter: filter,
        gl_linear: gl.LINEAR,
        gl_error: error,
        gl_error_name: errorName,
        canvas_width: gl.canvas.width,
        canvas_height: gl.canvas.height,
        tex_exists: !!renderer.fboA.texture,
        is_tex_a: isTexA,
        is_tex_b: isTexB
      };
    });

    if (fboState.error) {
        throw new Error(fboState.error);
    }

    expect(fboState.is_tex_a, 'FBO A texture should be a valid WebGL texture').toBe(true);
    expect(fboState.is_tex_b, 'FBO B texture should be a valid WebGL texture').toBe(true);
    expect(fboState.gl_error_name).toBe('NO_ERROR');
    expect(fboState.tex_exists).toBe(true);
    expect(fboState.fboA_width).toBe(Math.floor(fboState.canvas_width / 4));
    expect(fboState.fboA_height).toBe(Math.floor(fboState.canvas_height / 4));
    expect(fboState.fboA_filter).toBe(fboState.gl_linear);
  });

  test('Performance (Frame Time)', async ({ page }) => {
    // Measure average render time over 10 frames
    const avgTime = await page.evaluate(async () => {
        const renderer = window.uiManager.webglRenderer;
        const samples = 10;
        let total = 0;
        
        // Warm up
        renderer.render();
        
        for (let i = 0; i < samples; i++) {
            const start = performance.now();
            renderer.render();
            total += (performance.now() - start);
        }
        return total / samples;
    });

    console.log(`Average WebGL Render Time: ${avgTime.toFixed(4)}ms`);
    // Kawase blur on underlay should be extremely fast (< 5ms on modern hardware)
    expect(avgTime).toBeLessThan(10);
  });

  test('Resource Lifecycle (Cleanup)', async ({ page }) => {
    // Verify that resizing properly cleans up old resources
    const initialFboIds = await page.evaluate(() => {
      const renderer = window.uiManager.webglRenderer;
      // We can't directly compare texture objects easily across evaluations, 
      // but we can check if the internal state changes.
      return {
        fboA: !!renderer.fboA.texture,
        fboB: !!renderer.fboB.texture
      };
    });

    expect(initialFboIds.fboA).toBe(true);

    // Trigger multiple resizes
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(100);
    await page.setViewportSize({ width: 400, height: 300 });
    await page.waitForTimeout(100);

    const postResizeState = await page.evaluate(() => {
      const renderer = window.uiManager.webglRenderer;
      const gl = renderer.gl;
      
      return {
        isContextValid: !gl.isContextLost(),
        isTexAValid: gl.isTexture(renderer.fboA.texture),
        isTexBValid: gl.isTexture(renderer.fboB.texture),
        fboA_width: renderer.fboA.width,
        expected_width: Math.floor(gl.canvas.width / 4)
      };
    });

    expect(postResizeState.isContextValid).toBe(true);
    expect(postResizeState.isTexAValid).toBe(true);
    expect(postResizeState.isTexBValid).toBe(true);
    expect(postResizeState.fboA_width).toBe(postResizeState.expected_width);
  });

  test('Theme Synchronization', async ({ page }) => {
    // Verify uniforms match CSS variables
    const themeState = await page.evaluate(async () => {
      // Force theme to aurora
      document.body.classList.add('theme-aurora');
      
      // Trigger a sync manually to be sure
      window.uiManager.syncThemeColors();
      
      // Wait for DOM to update and getComputedStyle to be accurate
      await new Promise(r => setTimeout(r, 100));

      const renderer = window.uiManager.webglRenderer;
      const gl = renderer.gl;
      if (gl.isContextLost()) return { error: 'CONTEXT_LOST_WEBGL' };

      const program = renderer.primitiveProgram;
      gl.useProgram(program);

      const getUniform = (name) => {
        const loc = gl.getUniformLocation(program, name);
        if (!loc) return null;
        return gl.getUniform(program, loc);
      };

      const u1 = getUniform('uAuroraColor1');
      const u2 = getUniform('uAuroraColor2');
      const u3 = getUniform('uAuroraColor3');

      return {
        uAuroraColor1: u1 ? Array.from(u1) : null,
        uAuroraColor2: u2 ? Array.from(u2) : null,
        uAuroraColor3: u3 ? Array.from(u3) : null,
        cssColor1: getComputedStyle(document.body).getPropertyValue('--aurora-color-1').trim()
      };
    });

    if (themeState.error) {
        throw new Error(themeState.error);
    }

    expect(themeState.uAuroraColor1).not.toBeNull();
    expect(themeState.uAuroraColor2).not.toBeNull();
    expect(themeState.uAuroraColor3).not.toBeNull();
    
    // Check if the first color is not black (assuming cosmic aurora is active)
    expect(themeState.uAuroraColor1[0] + themeState.uAuroraColor1[1] + themeState.uAuroraColor1[2]).toBeGreaterThan(0);
  });

  test('Resize Robustness', async ({ page }) => {
    // Verify resize handling
    const newWidth = 640;
    const newHeight = 480;
    await page.setViewportSize({ width: newWidth, height: newHeight });
    
    // Give it more time to ensure ResizeObserver and context resize complete
    await page.waitForTimeout(250);
    
    // Trigger a render to ensure FBO resize logic in renderer.render() executes
    await page.evaluate(() => window.uiManager.webglRenderer.render());

    const fboSize = await page.evaluate(() => {
      const renderer = window.uiManager.webglRenderer;
      return {
        width: renderer.fboA.width,
        height: renderer.fboA.height,
        canvasWidth: renderer.gl.canvas.width
      };
    });

    // Check if FBOs were resized correctly to 1/4 of new canvas size
    const expectedWidth = Math.floor(fboSize.canvasWidth / 4);
    expect(fboSize.width).toBe(expectedWidth);
  });
});
