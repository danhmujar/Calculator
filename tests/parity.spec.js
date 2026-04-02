import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Visual Parity Audit (REQ-VER-02)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(1000); 
    });

    const compareModes = async (page, snapshotName, testInfo) => {
        // Ensure we are in Legacy mode (mode 2)
        await page.evaluate(() => {
            while (window.uiManager && window.uiManager.parityMode !== 2) {
                window.uiManager.toggleParityMode();
            }
        });
        await page.waitForTimeout(500);

        // Take Legacy screenshot (baseline)
        const legacyBuf = await page.screenshot();

        // Write as baseline dynamically to the correct path
        const snapshotPath = testInfo.snapshotPath(snapshotName);
        fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
        fs.writeFileSync(snapshotPath, legacyBuf);

        // Switch to WebGL-only mode (mode 0)
        await page.evaluate(() => {
            window.uiManager.toggleParityMode(); // Switches 2 -> 0
        });
        await page.waitForTimeout(500);

        // Expect WebGL screenshot to match the Legacy baseline we just saved
        // Allowing maxDiffPixelRatio up to 0.05 to account for anti-aliasing variations between standard DOM rendering and WebGL
        expect(await page.screenshot()).toMatchSnapshot(snapshotName, { maxDiffPixelRatio: 0.05 });
    };

    test('Standard Mode Parity', async ({ page }, testInfo) => {
        await compareModes(page, 'standard-mode.png', testInfo);
    });

    test('Scientific Mode Parity', async ({ page }, testInfo) => {
        const sciBtn = page.locator('#btn-mode-sci');
        if (await sciBtn.isVisible()) {
            await sciBtn.click();
            await page.waitForTimeout(1000);
        }
        await compareModes(page, 'scientific-mode.png', testInfo);
    });

    test('Cards Mode Parity', async ({ page }, testInfo) => {
        const stdBtn = page.locator('#btn-mode-std');
        if (await stdBtn.isVisible()) {
            await stdBtn.click();
            await page.waitForTimeout(1000);
        }
        
        await page.evaluate(() => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && !sidebar.classList.contains('open') && window.uiManager) {
                window.uiManager.toggleDrawer();
            }
        });
        await page.waitForTimeout(1000);
        await compareModes(page, 'cards-mode.png', testInfo);
    });
});