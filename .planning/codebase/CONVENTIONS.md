# Coding Conventions

**Analysis Date:** 2025-03-29

## Naming Patterns

**Files:**
- Lowercase and simple: `app.js`, `ui.js`, `sw.js`
- Kebab-case for configuration and scripts: `vite.config.js`, `postbuild.js`

**Functions:**
- camelCase: `formatOperator`, `calculateResult`, `updateDisplay`

**Variables:**
- camelCase: `calcState`, `proFormatter`, `deferredInstallPrompt`

**Constants:**
- UPPER_SNAKE_CASE: `TOAST_DURATION_MS`, `MAX_AUDIT_ENTRIES`, `CACHE_NAME`

## Code Style

**Modularization:**
- Use of IIFE (Immediately Invoked Function Expressions) to encapsulate logic and prevent global scope pollution.
- Example: `(function () { ... })();` in `services/app.js` and `ui/ui.js`.

**Formatting:**
- 4-space indentation.
- Single quotes for strings: `'use strict'`, `'click'`.
- Mandatory use of `'use strict';` at the top of IIFEs.

**Linting:**
- No formal linter configuration (`.eslintrc`, `.prettierrc`) found in the root.
- Style is maintained manually through consistent patterns.

## Import Organization

**Local Modules:**
- Handled by Vite in `index.html` via `<script type="module" src="...">` or traditional script tags for non-module files.
- Service Worker precaches local assets defined in `PRECACHE_URLS` within `public/sw.js`.

**External Libraries:**
- Dynamic loading from CDNs (unpkg, cdnjs) for heavy libraries like `mathjs` and `mathlive`.
- Versions are pinned and integrity hashes are used for security.
- Configuration found in `services/app.js`:
```javascript
const SCI_LIB_URLS = {
    mathlive: {
        src: 'https://unpkg.com/mathlive@0.108.3',
        integrity: 'sha384-JjPSUCAu+59S/H2IC4UecZ4gllGbNCS++kBwHbsk0TKHCp2b6OqkZqsRC9Kch45U'
    },
    ...
};
```

## Error Handling

**Patterns:**
- `try-catch` blocks for operations that can fail gracefully, such as:
    - `JSON.parse` for `localStorage` (`services/app.js`)
    - Clipboard API interactions (`services/app.js`)
    - Evaluation of mathematical expressions via `math.evaluate` (`services/app.js`)
- Validation checks before processing: `if (!saved) return false;`.

## Logging

**Framework:**
- Native `console` methods.

**Patterns:**
- `console.error` for failed state loads or critical runtime errors.
- `console.log` for build-time feedback in `scripts/postbuild.js`.

## Comments

**When to Comment:**
- High density of comments explaining business logic and UI transitions.
- Use of structural markers like `(APP-L3)`, `(APP-L5)`, `(UI-M1)` to reference specific logic blocks or fixes.

**JSDoc/TSDoc:**
- Basic JSDoc style for functions.
```javascript
/**
 * Converts internal operators to display symbols (APP-L4)
 */
function formatOperator(op) { ... }
```

## Accessibility (Critical Convention)

**Patterns:**
- Skip links for keyboard users: `<a href="#main-calc-display" class="skip-link">`.
- ARIA management: `aria-hidden`, `aria-label`, `role="radiogroup"`.
- Focus trapping in modals: Implemented in `ui/ui.js` using `getFocusableElements()`.
- Use of `inert` attribute to disable background elements when modals are open.

---

*Convention analysis: 2025-03-29*
