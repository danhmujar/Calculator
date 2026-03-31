import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('CalculatorService (TDD)', () => {
    test.beforeEach(async ({ page }) => {
        // Intercept network requests to serve our local module without a dev server
        await page.route('**/*', async (route) => {
            if (route.request().url().endsWith('/calculator.js')) {
                const calcPath = path.resolve(__dirname, '../services/calculator.js');
                const content = fs.readFileSync(calcPath, 'utf8');
                await route.fulfill({
                    status: 200,
                    contentType: 'application/javascript',
                    body: content
                });
            } else if (route.request().url().includes('/test-page')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'text/html',
                    body: `<!DOCTYPE html>
                    <html>
                    <body>
                    <script type="importmap">
                    {
                        "imports": {
                            "mathjs/number": "https://cdn.jsdelivr.net/npm/mathjs@15.1.1/+esm"
                        }
                    }
                    </script>
                    </body>
                    </html>`
                });
            } else {
                await route.continue();
            }
        });

        await page.goto('http://localhost/test-page');
    });

    test('Test 1: Basic Evaluation works', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { CalculatorService } = await import('./calculator.js');
            return {
                add: CalculatorService.evaluate('2+2'),
                sub: CalculatorService.evaluate('10-5'),
                mul: CalculatorService.evaluate('3*4'),
                div: CalculatorService.evaluate('20/5'),
            };
        });

        expect(result.add).toBe(4);
        expect(result.sub).toBe(5);
        expect(result.mul).toBe(12);
        expect(result.div).toBe(4);
    });

    test('Test 2: Scientific operations work', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { CalculatorService } = await import('./calculator.js');
            return {
                sqrt: CalculatorService.evaluate('sqrt(144)'),
                sin: CalculatorService.evaluate('sin(pi/2)'),
                log: CalculatorService.evaluate('log10(100)'),
            };
        });

        expect(result.sqrt).toBe(12);
        expect(Math.round(result.sin)).toBe(1);
        expect(result.log).toBe(2);
    });

    test('Test 3: Scope-based evaluation works', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { CalculatorService } = await import('./calculator.js');
            const scope = { x: 10, y: 2 };
            return CalculatorService.evaluate('x * y + 5', scope);
        });

        expect(result).toBe(25);
    });

    test('Test 4: Percentage calculations work', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { CalculatorService } = await import('./calculator.js');
            return {
                type1: CalculatorService.calculatePercentage('type1', 10, 50), // 10 is what % of 50 -> 20
                type2: CalculatorService.calculatePercentage('type2', 20, 500), // what is 20% of 500 -> 100
                type3: CalculatorService.calculatePercentage('type3', 100, 150), // change from 100 to 150 -> 50
                type4: CalculatorService.calculatePercentage('type4', 50, 20), // 50 is 20% of what -> 250
            };
        });

        expect(result.type1).toBe(20);
        expect(result.type2).toBe(100);
        expect(result.type3).toBe(50);
        expect(result.type4).toBe(250);
    });

    test('Test 5: Division by zero and errors handle gracefully', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { CalculatorService } = await import('./calculator.js');
            return {
                divZero: CalculatorService.evaluate('10/0'),
                invalid: CalculatorService.evaluate('invalid + expr'),
                type1Zero: CalculatorService.calculatePercentage('type1', 10, 0),
                type3Zero: CalculatorService.calculatePercentage('type3', 0, 10),
            };
        });

        // Math.js evaluate('10/0') returns Infinity, but my service should return null or handle it.
        // Looking at current app.js: result = a / b; if (b === 0) return null;
        expect(result.divZero).toBe(null);
        expect(result.invalid).toBe(null);
        expect(result.type1Zero).toBe('Error');
        expect(result.type3Zero).toBe('Error');
    });
});
