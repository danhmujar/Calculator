# Testing Patterns

**Analysis Date:** 2025-03-29

## Test Framework

**Runner:**
- Playwright (v1.58.2) - Configured in `package.json` but no test files found in the repository.

**Assertion Library:**
- Playwright/Axe-core for accessibility.

**Run Commands:**
```bash
# Not currently defined in package.json
# Expected (if added):
# npx playwright test
```

## Test File Organization

**Location:**
- No test files (`.test.js` or `.spec.js`) were detected in the project root or subdirectories.
- A directory for agent-specific screen reader testing exists at `.agent/skills/screen-reader-testing`, but it is for AI skills rather than project-specific unit/integration tests.

## Test Structure

**Suite Organization:**
- No suites currently implemented.

**Mocking Framework:**
- Playwright's built-in mocking capabilities.

## Accessibility Testing (Core Intent)

The project includes `@axe-core/playwright` as a dependency, indicating a priority on automated accessibility audits.

**Intended Usage:**
```javascript
// Example (not yet implemented)
import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test('should not have any accessibility violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
});
```

## Coverage

**Requirements:**
- None enforced.

## Test Types (Inferred from Dependencies)

**Unit/Integration Tests:**
- Not present.

**E2E / Accessibility Tests:**
- Infrastructure is ready via Playwright and Axe-core, but tests are currently missing.

## Current Testing Strategy (Manual)

Based on the lack of automated test suites, the current strategy is primarily:
- Manual verification of UI behavior.
- Manual cross-browser/cross-device testing via Vite.
- Manual verification of PWA functionality and service worker lifecycle.

---

*Testing analysis: 2025-03-29*
