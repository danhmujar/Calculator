import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Phase 02 Validation: Asset & Build Modernization', () => {
    
    test('P2-T1: SVG Sprite Sheet is loaded and icons are rendered', async ({ page }) => {
        await page.goto('http://localhost:4173/Calculator/');
        await page.waitForSelector('svg use');

        // Check if icons are using the sprite sheet
        const useElements = page.locator('svg use');
        const count = await useElements.count();
        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
            const xlinkHref = await useElements.nth(i).getAttribute('xlink:href');
            const href = await useElements.nth(i).getAttribute('href');
            const target = xlinkHref || href;
            expect(target).toMatch(/assets\/sprites(-[a-zA-Z0-9]+)?\.svg#/);
        }
    });

    test('P2-T2: PWA Manifest exists and is correctly referenced', async ({ page }) => {
        await page.goto('http://localhost:4173/Calculator/');
        const manifestLink = page.locator('link[rel="manifest"]');
        await expect(manifestLink).toBeAttached();
        
        const manifestUrl = await manifestLink.getAttribute('href');
        // In prod it might be manifest.webmanifest or /Calculator/manifest.webmanifest
        expect(manifestUrl).toMatch(/manifest\.webmanifest/);
    });

    test('P2-T2: Production Assets have content hashes', async () => {
        const distAssetsDir = path.resolve(process.cwd(), 'dist/assets');
        if (!fs.existsSync(distAssetsDir)) {
            console.warn('dist/assets not found, skipping hash check. Run npm run build first.');
            return;
        }

        const files = fs.readdirSync(distAssetsDir);
        const hashedFiles = files.filter(f => /-[a-zA-Z0-9_-]{7,}\.(js|css|svg|png|woff2)$/.test(f));
        
        // At least index.js and index.css should be hashed
        expect(hashedFiles.length).toBeGreaterThan(0);
        expect(hashedFiles.some(f => f.startsWith('index-') && f.endsWith('.js'))).toBe(true);
        expect(hashedFiles.some(f => f.startsWith('index-') && f.endsWith('.css'))).toBe(true);
    });

    test('P2-T2: Service Worker is registered', async ({ page }) => {
        await page.goto('http://localhost:4173/Calculator/');
        
        // Wait for SW to register
        const swStatus = await page.evaluate(async () => {
            if (!('serviceWorker' in navigator)) return 'not supported';
            const registration = await navigator.serviceWorker.ready;
            return registration.active ? 'active' : 'not active';
        });

        expect(swStatus).toBe('active');
    });

    test('P2-T3: Dependency Migration - mathjs and mathlive are bundled', async ({ page }) => {
        await page.goto('http://localhost:4173/Calculator/');
        
        // Check if mathjs is available (if exported to window or used via UI)
        // Since it's bundled, it might not be on window unless explicitly added.
        // We'll check the UI behavior (UAT-10 covers this, but we'll add a quick check)
        await page.click('button[data-value="7"]');
        await page.click('button[data-action="op"][data-value="+"]');
        await page.click('button[data-value="8"]');
        await page.click('button[data-action="equals"]');
        
        const display = page.locator('#main-calc-display');
        await expect(display).toHaveText('15');

        // Check MathLive in scientific mode
        await page.click('#btn-mode-sci');
        await expect(page.locator('math-field')).toBeVisible();
    });
});
