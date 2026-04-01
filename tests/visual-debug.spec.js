import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Capture Texture Atlas Screenshot', async ({ page }) => {
    // 1. Load the application
    await page.goto('http://localhost:5173');
    
    // 2. Read and inject the debug script
    const debugScript = fs.readFileSync(path.join(process.cwd(), 'scripts/debug-atlas.js'), 'utf8');
    await page.evaluate(debugScript);
    
    // 3. Run the atlas generation
    await page.evaluate(async () => {
        await window.debugAtlas();
        // Wait for images/canvas to render
        await new Promise(resolve => setTimeout(resolve, 1000));
    });
    
    // 4. Locate the debug container and take a screenshot
    const container = page.locator('#atlas-debug-container');
    await expect(container).toBeVisible();
    
    // Create directory for screenshots if it doesn't exist
    const screenshotDir = path.join(process.cwd(), 'test-results/visual-verification');
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    const screenshotPath = path.join(screenshotDir, 'texture-atlas-08-01.png');
    await container.screenshot({ path: screenshotPath });
    
    console.log(`Screenshot saved to: ${screenshotPath}`);
});
