import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audit', () => {
  test('Should pass accessibility audits (Axe)', async ({ page }) => {
    await page.goto('http://localhost:5173/Calculator/');
    
    // Wait for the main UI to be settled
    await page.waitForSelector('#main-calc-display');
    
    // Scan the page
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    // We expect zero violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('About Modal accessibility', async ({ page }) => {
    await page.goto('http://localhost:5173/Calculator/');
    
    // Open About Modal
    await page.click('#about-fab-btn');
    await page.waitForSelector('#about-overlay[aria-hidden="false"]');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('.about-modal')
      .analyze();
      
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Keyboard navigation: Tab cycle in Standard Mode', async ({ page }) => {
    await page.goto('http://localhost:5173/Calculator/');
    
    // Start by focusing the skip link or body
    await page.keyboard.press('Tab');
    
    // Get currently focused element
    const focusedHandle = await page.evaluateHandle(() => document.activeElement);
    const tagName = await focusedHandle.evaluate(el => el.tagName.toLowerCase());
    const isLinkOrButton = ['a', 'button'].includes(tagName);
    
    expect(isLinkOrButton).toBe(true);
  });
});
