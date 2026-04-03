import { test, expect } from '@playwright/test';

test.describe('Phase 1: Separation and Cleanup Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for uimanager to initialize and inject the canvas
    await page.waitForSelector('#webgl-underlay', { state: 'attached' });
  });

  test('REQ-WGL-01: #webgl-underlay is a direct child of <body>', async ({ page }) => {
    const parentIsBody = await page.evaluate(() => {
      const canvas = document.getElementById('webgl-underlay');
      return canvas && canvas.parentElement === document.body;
    });
    expect(parentIsBody).toBe(true);
  });

  test('REQ-WGL-02: CSS backdrop-filter is completely removed', async ({ page }) => {
    const offendingElements = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      return allElements
        .map(el => {
          const style = window.getComputedStyle(el);
          return {
            tagName: el.tagName,
            className: el.className,
            backdropFilter: style.backdropFilter,
            webkitBackdropFilter: style.webkitBackdropFilter
          };
        })
        .filter(info => {
          const bf = info.backdropFilter;
          const wbf = info.webkitBackdropFilter;
          return (bf && bf !== 'none' && bf !== '') || (wbf && wbf !== 'none' && wbf !== '');
        });
    });
    
    if (offendingElements.length > 0) {
      console.log('Offending Elements:', JSON.stringify(offendingElements, null, 2));
    }
    expect(offendingElements.length).toBe(0);
  });

  test('REQ-WGL-03: Underlay pattern properties (z-index, pointer-events)', async ({ page }) => {
    const props = await page.evaluate(() => {
      const canvas = document.getElementById('webgl-underlay');
      const style = window.getComputedStyle(canvas);
      return {
        zIndex: style.zIndex,
        pointerEvents: style.pointerEvents,
        position: style.position
      };
    });
    expect(props.zIndex).toBe('-1');
    expect(props.pointerEvents).toBe('none');
    expect(props.position).toBe('fixed');
  });

  test('Interactivity: User can still interact with calculator', async ({ page }) => {
    const digit7 = page.locator('button[data-value="7"]');
    await expect(digit7).toBeVisible();
    await digit7.click();
    
    const display = page.locator('#main-calc-display');
    await expect(display).toContainText('7');
  });
});
