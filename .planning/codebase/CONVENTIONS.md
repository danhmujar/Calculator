# Coding Conventions

**Analysis Date:** 2026-03-31

## Naming Patterns

**Files:**
- Kebab-case for most files: `eye-tracker.js`, `display.spec.js`, `vite.config.js`.
- Simple lowercase for core files: `ui.js`, `app.js`, `store.js`, `renderer.js`.
- Directories are simple lowercase: `ui`, `services`, `tests`, `public`.

**Functions:**
- camelCase for standard functions: `openAbout()`, `closeAbout()`, `escapeHandler(e)`, `fitDisplayText()`.
- IIFEs used in `ui/ui.js` for module scoping without polluting global namespace.

**Variables:**
- camelCase for variables: `previouslyFocused`, `overlay`, `modal`, `isResizing`.
- SCREAMING_SNAKE_CASE for configuration constants: `FOCUS_DELAY_MS`.

**Types:**
- PascalCase for Classes: `Renderer` in `ui/renderer.js`, `Store` in `services/store.js`.
- Private methods/properties use underscore prefix: `_persistState`, `_saveTimeout`.

## Code Style

**Formatting:**
- Indentation: Mixed use of 2-space and 4-space indentation.
  - 2-space: `ui/renderer.js`.
  - 4-space: `ui/ui.js`, `services/store.js`, `services/app.js`.
- Semicolons: Consistently used.
- Quotes: Predominantly single quotes `'` for strings.
- Trailing commas: Used in object and array literals.

**Linting:**
- No explicit ESLint/Prettier configuration found in the root.
- Conventions appear to be maintained manually or via editor defaults.

## Import Organization

**Order:**
1. Standard Library / Built-ins (e.g., `import path from 'path'`).
2. Third-party Libraries (e.g., `import { test, expect } from '@playwright/test'`).
3. Local Modules (e.g., `import { store } from '../services/store.js'`).

**Path Aliases:**
- Not used. Relative paths are used: `./services/app.js`, `../ui/renderer.js`.

## Error Handling

**Patterns:**
- `try...catch` blocks for risky browser APIs: `localStorage.setItem` in `Store`, layout flushing in `Renderer`.
- Graceful degradation: `isBrowser` checks to allow logic to run in Node.js environments (for tests).
- Console logging for errors: `console.error('Renderer layout batched writing error:', err)`.

## Logging

**Framework:** `console`

**Patterns:**
- Errors are logged with `console.error`.
- Debugging logs in tests: `console.log('BROWSER CONSOLE:', msg.text())`.

## Comments

**When to Comment:**
- To describe complex logic (e.g., font fitting math, rAF batching).
- To mark "FIX" or "UAT" related improvements (e.g., `// UI-M4 FIX: Lock body scroll`).
- Section headers in large files.

**JSDoc/TSDoc:**
- Used for class methods to describe parameters and return values:
  ```javascript
  /**
   * Batch DOM updates. Call `requestAnimationFrame` only once per frame...
   * @param {Function} callback 
   */
  ```

## Function Design

**Size:** Functions are generally small and focused on a single responsibility.

**Parameters:** Prefer positional arguments for few parameters, and options objects for more complex configurations:
- `fitDisplayText(text, containerWidth, options = {})`

**Return Values:** Methods like `fitDisplayText` return structured objects: `{ text: string, fontSizeRem: number }`.

## Module Design

**Exports:**
- Named exports for Classes and singletons: `export class Store`, `export const store = new Store()`.
- ES Modules (`type: module` in `package.json`).

**Barrel Files:**
- Not observed. Direct imports from file paths are preferred.

---

*Convention analysis: 2026-03-31*
