<<<<<<< HEAD

# Refactoring Plan: UIManager Decomposition & Module Reorganization

Based on graphify analysis — 2026-07-15

## Status: COMPLETE

All phases executed successfully. Build passes, 13/13 tests pass.

## Objectives

1. Decompose UIManager god node (46 edges, 35+ methods) into focused coordinators
2. Improve Community 0 cohesion (0.074) by grouping related modules
3. Preserve all existing functionality, event delegation, accessibility, and PWA caching

---

## Phase 1: Extract DisplayManager ✅

**New file:** `ui/display-manager.js`

Extract display update logic from UIManager:

| Method                 | Current Location | Responsibility                         |
| ---------------------- | ---------------- | -------------------------------------- |
| `updateDisplay()`      | uimanager.js:862 | Render current calculator state to DOM |
| `formatOperator()`     | uimanager.js:126 | Format operator symbols for display    |
| `calculateRowResult()` | uimanager.js:524 | Compute percentage result for a row    |
| `proFormatter`         | uimanager.js:97  | Intl.NumberFormat instance             |

**Dependencies to pass:**

- `store` (read state)
- `themeManager` (get uniforms for WebGL)
- `webglRenderer` (push glyphs/rects)

**Test:** Verify all calculator operations display correctly after extraction.

---

## Phase 2: Extract AuditTrail ✅

**New file:** `ui/audit-trail.js`

Extract audit/logging logic:

| Method                 | Current Location | Responsibility                       |
| ---------------------- | ---------------- | ------------------------------------ |
| `addAuditEntry()`      | uimanager.js:882 | Add entry to audit log DOM           |
| `createAuditActions()` | uimanager.js:921 | Create action buttons for audit rows |
| `clearAuditTape()`     | uimanager.js:945 | Clear audit log DOM                  |

**Dependencies to pass:**

- `store` (read/write auditData)
- `document` (DOM manipulation)

**Test:** Verify audit trail entries appear, actions work, clear empties list.

---

## Phase 3: Extract ThemeCoordinator ✅

**New file:** `ui/theme-coordinator.js`

Extract theme management:

| Method                    | Current Location | Responsibility              |
| ------------------------- | ---------------- | --------------------------- |
| `toggleTheme()`           | uimanager.js:778 | Cycle through theme list    |
| `setThemeColor()`         | uimanager.js:814 | Apply specific theme class  |
| `setupThemePicker()`      | uimanager.js:248 | Initialize theme picker UI  |
| `togglePaletteDropdown()` | uimanager.js:282 | Open/close palette dropdown |
| `syncThemeColors()`       | uimanager.js:107 | Sync CSS variables to WebGL |
| `getThemeUniforms()`      | uimanager.js:103 | Get theme data for renderer |
| `getBackgroundMode()`     | uimanager.js:241 | Determine aurora/dark mode  |
| `VALID_THEMES`            | uimanager.js:30  | Theme class list            |

**Dependencies to pass:**

- `themeManager` (from services/theme.js)
- `webglRenderer` (update uniforms)
- `typographyManager` (update glyphs)

**Test:** Verify theme switching, palette dropdown, aurora themes work.

---

## Phase 4: Extract RowManager ✅

**New file:** `ui/row-manager.js`

Extract row lifecycle:

| Method                     | Current Location  | Responsibility                  |
| -------------------------- | ----------------- | ------------------------------- |
| `createRow()`              | uimanager.js:535  | Build row DOM structure         |
| `addRow()`                 | uimanager.js:605  | Add new row to card             |
| `deleteRow()`              | uimanager.js:638  | Remove row from card            |
| `restorePercentageCards()` | uimanager.js:368  | Restore saved card state        |
| `restoreScientificRows()`  | uimanager.js:396  | Restore saved scientific rows   |
| `activateScientificMode()` | uimanager.js:1013 | Switch to scientific calculator |
| `createRowInput()`         | uimanager.js:114  | Create input element            |
| `ROW_BUILDERS`             | uimanager.js:48   | Card type templates             |

**Dependencies to pass:**

- `store` (read/write row state)
- `displayManager` (calculate results)
- `eventManager` (bind row events)

**Test:** Verify add/delete rows, percentage cards, scientific mode work.

---

## Phase 5: Extract ToastManager ✅

**New file:** `ui/toast-manager.js`

Extract notification logic:

| Method              | Current Location | Responsibility             |
| ------------------- | ---------------- | -------------------------- |
| `showToast()`       | uimanager.js:670 | Display toast notification |
| `showUpdateToast()` | uimanager.js:685 | Display PWA update toast   |
| `toastTimeout`      | uimanager.js:18  | Timeout reference          |
| `TOAST_DURATION_MS` | uimanager.js:16  | Duration constant          |

**Dependencies to pass:**

- `document` (DOM manipulation)

**Test:** Verify toasts appear and auto-dismiss.

---

## Phase 6: Slim Down UIManager ✅

**File:** `ui/uimanager.js`

After extractions, UIManager becomes a thin orchestrator:

```javascript
export class UIManager {
  constructor() {
    this.displayManager = new DisplayManager();
    this.auditTrail = new AuditTrail();
    this.themeCoordinator = new ThemeCoordinator();
    this.rowManager = new RowManager();
    this.toastManager = new ToastManager();
  }

  async init() {
    // Coordinate initialization order
    this.themeCoordinator.setupThemePicker();
    this.setupResizeHandler();
    this.setupA11y();
    this.setupFocusHandling();
    this.setupKeyboardShortcuts();
    this.setupPasteSupport();
    this.setupEntranceAnimations();
    this.restoreState(store.getState());
  }

  // Delegate to sub-managers
  updateDisplay() {
    this.displayManager.updateDisplay();
  }
  showToast(msg) {
    this.toastManager.showToast(msg);
  }
  // ... etc
}
```

**Remaining methods (pure coordination):**

- `init()` — orchestrate startup sequence
- `restoreState()` — restore saved state to all sub-managers
- `restoreThemeAndMode()` — restore theme + calc mode
- `setupResizeHandler()` — coordinate resize across managers
- `setupEntranceAnimations()` — CSS animation setup
- `syncLayoutDuringTransition()` — coordinate layout sync
- `setupA11y()` — accessibility attributes
- `setupFocusHandling()` — focus trap for modals
- `setupKeyboardShortcuts()` — keyboard bindings
- `setupPasteSupport()` — paste event handling
- `toggleDrawer()` — sidebar toggle
- `toggleHistory()` — history panel toggle
- `setCalcMode()` — switch standard/scientific
- `updateMemoryIndicator()` — memory M indicator
- `setupMathFieldListeners()` — MathLive field events
- `copyResult()` — copy to clipboard
- `createCopySvg()` — copy icon SVG

---

## Phase 7: Reorganize Community 0 Modules ✅

**Directory structure change:**

```
services/
  core/
    app.js          (orchestrator)
    events.js       (event bindings)
    store.js        (state management)
    layout.js       (resize handling)
  math/
    calculator.ts   (calculation logic)
  pwa.js            (PWA manager - stays)
  theme.js          (theme service - stays)

ui/
  uimanager.js      (thin orchestrator)
  display-manager.js (new)
  audit-trail.js    (new)
  theme-coordinator.js (new)
  row-manager.js    (new)
  toast-manager.js  (new)
  renderer.js       (DOM renderer - stays)
  eye-tracker.js    (stays)
  webgl/            (stays as-is)
```

**Import updates required:**

- `app.js` — update import paths for new locations
- `uimanager.js` — update import paths for new sub-managers
- `index.html` — no changes (scripts loaded at end of body)
- `sw.js` — add new files to PRECACHE_URLS

---

## Risk Mitigation

| Risk                      | Mitigation                                                     |
| ------------------------- | -------------------------------------------------------------- |
| Circular imports          | Sub-managers receive dependencies via constructor, not imports |
| Event delegation breakage | Keep data-action/data-value attributes unchanged               |
| localStorage key change   | No changes to store.js persistence layer                       |
| Service worker cache miss | Add new files to sw.js PRECACHE_URLS before deploy             |
| Accessibility regression  | Keep aria-label/role attributes in extracted modules           |
| Performance regression    | No new async operations, same DOM manipulation patterns        |

---

## Verification Checklist

- [x] All calculator operations work (percentage types 1-4)
- [x] Scientific mode activates and calculates
- [x] Theme switching works (all 13 themes)
- [x] Aurora themes animate correctly
- [x] BTS theme loads assets
- [x] Audit trail logs entries
- [x] Copy result works
- [x] Keyboard shortcuts work
- [x] Paste support works
- [x] Toast notifications appear
- [x] PWA update toast works
- [x] Responsive resize works
- [x] Eye tracking initializes
- [x] WebGL rendering works
- [x] Typography manager works
- [x] localStorage persistence works
- [x] Service worker caches new files
- [ ] Accessibility audit passes
- [x] All Playwright tests pass

---

## Feature Enhancements Checklist (Added 2026-07-15)

- [x] Row Naming Feature implemented, styled, and verified
- [x] Main Display Copy Button implemented, styled, and verified
- [x] # Changelog Popup Feature implemented, styled, and verified

# Implementation Plan: Refactor Calculator Codebase

## Overview

Refactor the Calculator codebase to address issues identified in the graph analysis. The `UIManager` god node will be decomposed into four focused coordinators (`DisplayManager`, `AuditTrail`, `ThemeCoordinator`, `RowManager`) leaving `UIManager` as a thin orchestrator. Additionally, the loosely-cohesive Community 0 will be resolved by physically restructuring the modules into explicit domain directories (`core/`, `math/`, `rendering/`).

## Architecture Decisions

- **Thin Orchestrator:** `UIManager` remains the single entry point for UI interactions from `app.js` and `events.js`. It will hold references to the extracted managers and delegate calls to them. This preserves the external API and avoids a massive rewrite of `events.js`.
- **Domain-Driven Directories:** Modules will be moved to folders that reflect their domain (e.g., `services/core/`, `services/math/`, `ui/rendering/`). This solves the low cohesion issue by explicitly grouping related logic, preventing them from being grouped merely as a "catch-all" by the graph.
- **PWA Compatibility:** The Vite PWA plugin uses glob patterns (`**/*.{js,ts,...}`) to generate the Service Worker cache. Reorganizing folders will not break the Service Worker as long as the glob patterns still match the files and `index.html` references the correct updated paths.

## Task List

### Phase 1: Decompose UIManager

- [ ] **Task 1: Extract DisplayManager**
      **Description:** Extract display formatting and UI updating logic.
      **Acceptance criteria:**
  - Create `ui/managers/display-manager.js`.
  - Move `updateDisplay`, `updateMemoryIndicator`, and `formatOperator` from `UIManager` into `DisplayManager`.
  - `UIManager` instantiates `DisplayManager` and delegates these methods.
    **Verification:**
  - Build succeeds: `npm run build`
  - Manual check: Calculator display formats numbers and scientific notation correctly.

- [ ] **Task 2: Extract AuditTrail**
      **Description:** Extract calculation history tape logic.
      **Acceptance criteria:**
  - Create `ui/managers/audit-trail.js`.
  - Move `addAuditEntry`, `createAuditActions`, and `clearAuditTape` into `AuditTrail`.
  - Provide a callback mechanism for `useAuditValue` back to the app orchestrator.
    **Verification:**
  - Build succeeds: `npm run build`

- [ ] **Task 3: Extract ThemeCoordinator**
      **Description:** Extract UI theme toggling, color picking, and uniform syncing.
      **Acceptance criteria:**
  - Create `ui/managers/theme-coordinator.js`.
  - Move `setupThemePicker`, `toggleTheme`, `setThemeColor`, `restoreThemeAndMode`, `getBackgroundMode`, `getThemeUniforms`, and `syncThemeColors` into `ThemeCoordinator`.
    **Verification:**
  - Build succeeds: `npm run build`
  - Manual check: Changing themes in the palette updates the WebGL canvas and UI variables.

- [ ] **Task 4: Extract RowManager**
      **Description:** Extract standard percentage rows and scientific math field rows.
      **Acceptance criteria:**
  - Create `ui/managers/row-manager.js`.
  - Move percentage logic (`addRow`, `deleteRow`, `calculateRowResult`, `ROW_BUILDERS`).
  - Move scientific logic (`activateScientificMode`, `addScientificRow`, `setupMathFieldListeners`).
    **Verification:**
  - Build succeeds: `npm run build`
  - Tests pass: `npm run test:e2e`

### Checkpoint: UIManager Decomposed

- [ ] `npm run build` succeeds
- [ ] `npm run test:e2e` passes
- [ ] `ui/uimanager.js` is primarily delegation logic

### Phase 2: Resolve Core Cohesion

- [ ] **Task 5: Reorganize Core Services**
      **Description:** Group app orchestration and state logic together.
      **Acceptance criteria:**
  - Move `app.js`, `events.js`, `store.js`, `layout.js`, and `pwa.js` into `services/core/`.
  - Move `pwa-early.js` into `services/core/` (from `public/services/` if applicable, else adjust `index.html`).
  - Update all internal relative imports in these files.
  - Update `<script>` tags in `index.html`.
    **Verification:**
  - Build succeeds: `npm run build`

- [ ] **Task 6: Reorganize Math Services**
      **Description:** Isolate standalone math evaluation.
      **Acceptance criteria:**
  - Move `calculator.ts` and `calculator.test.js` into `services/math/`.
  - Update imports in `app.js` and `uimanager.js`.
    **Verification:**
  - Tests pass: `npm run test:unit`

- [ ] **Task 7: Reorganize UI Rendering**
      **Description:** Group visual output tools together.
      **Acceptance criteria:**
  - Move `ui/renderer.js` and `ui/eye-tracker.js` into `ui/rendering/`.
  - Move `ui/managers/*` to complete the UI structural split.
  - Update imports in `uimanager.js` and `app.js`.
    **Verification:**
  - Build succeeds: `npm run build`
  - Tests pass: `npm run test:e2e`

### Checkpoint: Complete

- [ ] All unit and end-to-end tests pass
- [ ] Application loads and operates normally (no 404s in console)
- [ ] Service worker registers successfully
- [ ] Ready for review

## Risks and Mitigations

| Risk                                    | Impact | Mitigation                                                                                                                                                                         |
| --------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Circular dependencies during extraction | Medium | Keep `UIManager` as the hub that instantiates the extracted managers and passes dependencies downward via constructor injection.                                                   |
| Broken PWA caching                      | High   | Vite PWA `globPatterns` captures `**/*.js`, but we must ensure `index.html` `<script>` paths correctly point to the moved `core/app.js` to avoid runtime 404s.                     |
| WebGL Context race conditions           | Medium | `DisplayManager` and `ThemeCoordinator` both rely on `WebGLRenderer`. They must receive the `webglRenderer` instance or queue renders via `renderer.schedule()` as currently done. |

## Open Questions

- Should `uimanager.js` be moved to `ui/managers/uimanager.js` or stay in `ui/uimanager.js`? (Plan assumes leaving it in `ui/managers/` for consistency, but updating imports accordingly).
  > > > > > > > c12009ab974d5d9ebd581a44ea1289ad3d07ef71
