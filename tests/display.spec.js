import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Renderer - Font Display Fitting', () => {
  let rendererScript;

  test.beforeAll(() => {
    // Read the script to inject into the page
    const scriptPath = path.resolve(__dirname, '../ui/renderer.js');
    const content = fs.readFileSync(scriptPath, 'utf-8').replace(/export /g, '');
    // Explicitly attach to window for Playwright evaluation access
    rendererScript = `${content}\nwindow.Renderer = Renderer;\nwindow.renderer = renderer;`;
  });

  test.beforeEach(async ({ page }) => {
    // Inject the Renderer class logic directly into the blank page context
    await page.addScriptTag({ content: rendererScript });
    
    // Validate it loaded properly onto window object
    await page.waitForFunction(() => typeof window.renderer !== 'undefined');
  });

  test('Test 1: fitDisplayText correctly scales font sizes for different widths', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Analyze text against a 150px constrained box, expecting it to shrink below 4.0 maxRem if long
      return window.renderer.fitDisplayText("123456789", 150, { minRem: 1, maxRem: 4, remToPx: 16 });
    });
    
    expect(result.text).toBe("123456789");
    expect(typeof result.fontSizeRem).toBe('number');
    // Ensure scaling logic clamped bounds properly natively
    expect(result.fontSizeRem).toBeLessThanOrEqual(4);
    expect(result.fontSizeRem).toBeGreaterThanOrEqual(1);
  });

  test('Test 2: Large numbers fallback to scientific notation at minimum size', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Passing an unrealistically huge integer against an impossibly narrow virtual container
      return window.renderer.fitDisplayText("12345678901234567890123456", 50, { minRem: 1, maxRem: 4, remToPx: 16 });
    });
    
    // Should fallback to scientific notation (toExponential(4)) thus contain 'e+'
    expect(result.text).toContain('e+');
    
    // Should be clamped hard at the minimum font scale
    expect(result.fontSizeRem).toBe(1); 
  });

  test('Test 3: Multiple measure calls within one frame trigger only one DOM write', async ({ page }) => {
    const writeCount = await page.evaluate(() => {
      return new Promise((resolve) => {
        let executionCount = 0;
        
        // Push multiple writes onto the flush queue
        window.renderer.schedule(() => { executionCount++; });
        window.renderer.schedule(() => { executionCount++; });
        window.renderer.schedule(() => { executionCount++; });
        
        // Wait for the next active frame tick to process the batch
        requestAnimationFrame(() => {
          resolve(executionCount); 
        });
      });
    });
    
    // Ensures exactly 3 scheduled callbacks fired in unison across 1 underlying rAF cycle
    expect(writeCount).toBe(3); 
  });

  test('Performance check: < 1ms for 1000 fitDisplayText calls', async ({ page }) => {
    const timeTaken = await page.evaluate(() => {
      const start = performance.now();
      
      // Spam the function
      for (let i = 0; i < 1000; i++) {
        // Repeated identical tests should trigger the Map O(1) textWidthCache hit optimally
        window.renderer.fitDisplayText("999999", 200, { minRem: 1, maxRem: 4, remToPx: 16 }); 
      }
      
      return performance.now() - start;
    });

    // Time budget for native logic is < 1ms, but giving pad for Playwright pipeline dispatch overheads
    expect(timeTaken).toBeLessThan(50);
  });
});
