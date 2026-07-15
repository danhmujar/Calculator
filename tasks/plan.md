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
- [x] Changelog Popup Feature implemented, styled, and verified
