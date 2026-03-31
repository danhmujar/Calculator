# Phase 06-04: Event Extraction, Orchestrator Refactor & MathLive Init - Summary

## Changes

### 1. Extracted Event Delegation to `services/events.js`
- Created `EventManager` class to handle all global event delegation.
- Moved keypad, sidebar, left panel, and global keyboard/paste listeners from `app.js`.
- Defined a clean callback interface for binding interactions to service logic.

### 2. Refactored `services/app.js` as Orchestrator
- `AppOrchestrator` now initializes all services (`Store`, `UIManager`, `PWAManager`, `EventManager`).
- Removed all direct DOM event binding logic.
- Managed domain-specific logic (calculations, state saving/loading) through methods called by `EventManager` callbacks.

### 3. Event-driven MathLive Initialization
- Updated `ui/uimanager.js` to use the `mount` event for restoring MathLive field values.
- Removed `SCI_RESTORE_DELAY_BASE_MS` and all `setTimeout` based restoration logic.
- Ensured MathLive is lazy-loaded only when scientific mode is activated.
- Configured `MathfieldElement.fontsDirectory` dynamically within the lazy-load block.

## Verification Results

### Automated Tests
- `tests/scientific.spec.js`: **PASSED** (Lazy loading and evaluation verified).
- `tests/scientific-hardened.spec.js` (Temporary): **PASSED** (Verified `mount` event usage and no `setTimeout` in restoration).

### Syntax & Integration
- `node -c services/app.js`: **PASSED**.
- `grep` verification for `EventManager` integration: **PASSED**.

## Impact
- **Stability:** Race conditions in scientific row restoration are resolved by relying on the component's lifecycle (`mount` event) instead of arbitrary delays.
- **Maintainability:** `app.js` is now significantly cleaner and focused on high-level coordination.
- **Performance:** MathLive assets are only loaded when needed.
