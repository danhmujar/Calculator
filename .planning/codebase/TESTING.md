# Testing Patterns

**Analysis Date:** 2026-03-31

## Test Framework

**Runner:**
- Playwright (`@playwright/test` ^1.58.2)

**Assertion Library:**
- Built-in `@playwright/test` `expect` (Jest-like)

**Run Commands:**
(Not explicitly in `package.json`, but use the standard CLI):
```bash
npx playwright test              # Run all tests
npx playwright test --ui         # UI Mode for debugging
npx playwright test --project=chromium # Run in specific browser
```

## Test File Organization

**Location:**
- Separate directory: `tests/`

**Naming:**
- `*.spec.js` (e.g., `display.spec.js`, `integration.spec.js`)

**Structure:**
```
tests/
├── accessibility.spec.js   # Axe-based accessibility audits
├── display.spec.js         # Renderer UI logic unit tests
├── integration.spec.js     # Multi-component/E2E tests
├── performance.spec.js     # Hardware acceleration checks
├── phase-02.spec.js        # Phase-specific requirements
├── scientific.spec.js      # Scientific mode/MathLive tests
├── state.spec.js           # Store persistence/logic tests
├── uat-02.spec.js          # User Acceptance Tests (UAT)
└── update.spec.js          # Service Worker/Update tests
```

## Test Structure

**Suite Organization:**
```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/Calculator/');
  });

  test('Test Case 1', async ({ page }) => {
    // Action
    // Assertion
  });
});
```

**Patterns:**
- **Setup:** `test.beforeEach` or `test.beforeAll` to initialize page or mock scripts.
- **Teardown:** Generally handled automatically by Playwright's `context` cleanup.
- **Assertion:** Uses standard `expect(X).toBe(Y)` or locator-based `expect(locator).toHaveText(Z)`.

## Mocking

**Framework:** Playwright's native interception (`page.route`, `page.addScriptTag`)

**Patterns:**
1. **Script Injection (Unit Tests):** Injecting local JS files into a blank browser context to test pure logic (e.g., `tests/display.spec.js` and `tests/state.spec.js`).
```javascript
const scriptPath = path.resolve(__dirname, '../ui/renderer.js');
const content = fs.readFileSync(scriptPath, 'utf-8').replace(/export /g, '');
await page.addScriptTag({ content: `${content}\nwindow.Renderer = Renderer;` });
```
2. **Network Interception:** Overriding module loads to serve disk files or mocks (e.g., `tests/state.spec.js`).
```javascript
await page.route('**/*', async (route) => {
  if (route.request().url().endsWith('/store.js')) {
    const content = fs.readFileSync(storePath, 'utf8');
    await route.fulfill({ contentType: 'application/javascript', body: content });
  } else {
    await route.continue();
  }
});
```

**What to Mock:**
- External services (if any existed).
- Local files when testing in isolation without a full dev server.
- `window.localStorage` to verify persistence logic.

**What NOT to Mock:**
- Core DOM APIs (use Playwright's browser environment).
- Math libraries (`mathjs`, `mathlive`) in integration tests to ensure bundling works.

## Fixtures and Factories

**Test Data:**
- Manual state initialization in `page.evaluate`.
- `localStorage.setItem` for pre-loading state:
```javascript
window.localStorage.setItem('interactiveCalcState', JSON.stringify({ presetValue: 42 }));
```

**Location:**
- Usually inline within `test` or `beforeEach` blocks.

## Coverage

**Requirements:** None enforced in `package.json`.

**View Coverage:**
(Playwright doesn't have a built-in coverage tool in the same way Vitest does; often requires a plugin or manual integration with `v8-to-istanbul`.)

## Test Types

**Unit Tests:**
- Test `Renderer` and `Store` logic in isolation by injecting code into `page`.
- Focus on logic like `fitDisplayText`, state transitions, and debounced persistence.

**Integration Tests:**
- Full E2E flows: `Store` -> `Renderer` -> `UI`.
- Test user interactions (clicks, keyboard) and state reflection in the DOM.

**Accessibility Tests:**
- Uses `@axe-core/playwright` (`AxeBuilder`) for WCAG compliance checks.
- Specific tests for Modal focus trapping and keyboard navigation.

**Performance Tests:**
- Verifies hardware acceleration via CSS variables.
- Measures execution time of performance-intensive methods (`fitDisplayText`).

## Common Patterns

**Async Testing:**
- `await page.waitForSelector()` for UI updates.
- `await page.waitForTimeout()` for debounced operations (e.g., waiting 600ms for a 500ms debounce).
- `page.evaluate(async () => { ... })` for complex browser-side async logic.

**Error Testing:**
- Log monitoring:
```javascript
page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
```

---

*Testing analysis: 2026-03-31*
