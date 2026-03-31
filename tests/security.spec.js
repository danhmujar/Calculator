import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Calculator Security Hardening (TDD)', () => {
    test.beforeEach(async ({ page }) => {
        // Intercept network requests to serve our local module
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

    test('Security 1: Block prototype pollution (AccessorNode)', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { CalculatorService } = await import('./calculator.js');
            return {
                constructor: CalculatorService.evaluate('[].constructor'),
                prototype: CalculatorService.evaluate('"".prototype'),
                toString: CalculatorService.evaluate('{}.toString'),
                bracket: CalculatorService.evaluate('math["evaluate"]')
            };
        });

        expect(result.constructor).toBe(null);
        expect(result.prototype).toBe(null);
        expect(result.toString).toBe(null);
        expect(result.bracket).toBe(null);
    });

    test('Security 2: Block high-risk functions', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { CalculatorService } = await import('./calculator.js');
            return {
                import: CalculatorService.evaluate('import("fs")'),
                evaluate: CalculatorService.evaluate('evaluate("2+2")'),
                createUnit: CalculatorService.evaluate('createUnit("test")'),
            };
        });

        expect(result.import).toBe(null);
        expect(result.evaluate).toBe(null);
        expect(result.createUnit).toBe(null);
    });

    test('Security 3: Block access to globals', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const { CalculatorService } = await import('./calculator.js');
            return {
                window: CalculatorService.evaluate('window'),
                console: CalculatorService.evaluate('console'),
                process: CalculatorService.evaluate('process'),
            };
        });

        expect(result.window).toBe(null);
        expect(result.console).toBe(null);
        expect(result.process).toBe(null);
    });
});
