# Codebase Concerns

**Analysis Date:** 2024-03-29

## Tech Debt

**Monolithic Business Logic:**
- Issue: `services/app.js` is a massive monolith (1569 lines) containing state management, business logic, DOM manipulation, and UI templates.
- Files: `services/app.js`
- Impact: High cognitive load for developers; extremely difficult to unit test; increased risk of side effects when modifying logic.
- Fix approach: Break `services/app.js` into smaller modules (e.g., `state.js`, `calculator-logic.js`, `dom-utils.js`, `percentage-logic.js`).

**Mixing of Concerns (HTML in JS):**
- Issue: UI templates are defined as string literals within the logic layer.
- Files: `services/app.js` (specifically `ROW_TEMPLATES`)
- Impact: Violates separation of concerns; makes UI changes harder to track; lack of syntax highlighting and linting for templates.
- Fix approach: Move templates to a dedicated `templates/` directory or use a lightweight template library/web components.

**Dead Code / Archives:**
- Issue: The repository contains a full copy of previous versions in the `archives/` folder.
- Files: `archives/` directory
- Impact: Increases repository size; can lead to accidental editing or referencing of old code.
- Fix approach: Rely on Git history for version tracking and remove the `archives/` directory.

**Missing Test Suite:**
- Issue: `package.json` includes Playwright, but there are no actual test files or a `test` script.
- Files: `package.json`, `tests/` (missing)
- Impact: No automated way to verify that math logic or UI interactions work correctly; high risk of regression.
- Fix approach: Implement basic unit tests for math operations and E2E tests for core user flows.

## Security Considerations

**CDN Dependencies:**
- Issue: Core scientific functionality depends on `unpkg.com` and `cdnjs.cloudflare.com`.
- Files: `services/app.js`, `public/sw.js`
- Impact: If CDNs are blocked or down, scientific mode fails. SRI is present, which mitigates tampering but not availability.
- Fix approach: Bundle these dependencies locally using npm/Vite.

**Dynamic Expression Evaluation:**
- Issue: Uses `math.evaluate()` for scientific mode formulas.
- Files: `services/app.js` (Line 1420)
- Impact: Potential for resource exhaustion or unintended behavior if users input extremely complex expressions (partially mitigated by `MATH_EXPR_LIMIT`).
- Recommendations: Ensure strict input sanitization before passing strings to `math.evaluate()`.

## Performance Bottlenecks

**Large Unoptimized CSS:**
- Issue: `ui/styles.css` is over 2200 lines long, largely due to 12 different themes.
- Files: `ui/styles.css`
- Cause: Inclusion of all theme variables and styles in a single file without a CSS-in-JS or CSS-module approach.
- Improvement path: Split CSS into base styles and theme-specific files, or use a CSS utility framework to reduce duplication.

## Fragile Areas

**State-DOM Synchronization:**
- Issue: `calcState` is a plain JavaScript object manipulated directly alongside manual DOM updates.
- Files: `services/app.js`
- Why fragile: There is no single source of truth or reactive binding. Forgetting a `updateDisplay()` call after a state change results in UI bugs.
- Safe modification: Always call `updateDisplay()` or `triggerSave()` after modifying `calcState`.
- Test coverage: None.

**Manual Service Worker Management:**
- Files: `public/sw.js`
- Why fragile: Versioning and cache management are handled manually with constants.
- Safe modification: Use a library like Workbox (which seems to be used in the `dist` folder via Vite PWA, but `public/sw.js` exists as a separate manual file).

## Missing Critical Features

**Automated Testing:**
- Problem: Complete lack of automated tests for a math-heavy application.
- Blocks: Confident refactoring of the monolithic `services/app.js`.

**Type Safety:**
- Problem: The project is pure JavaScript with minimal documentation.
- Blocks: Understanding of complex state shapes and function signatures.

---

*Concerns audit: 2024-03-29*
