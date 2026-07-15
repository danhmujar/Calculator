<<<<<<< HEAD

# Implementation Todo — Parallel Execution Plan

## Round 1: Create New Modules (parallel)

All 4 tasks can run simultaneously — no interdependencies.

### Task 1A: DisplayManager

- [x] Create `ui/display-manager.js`
- [x] Move `updateDisplay()`, `formatOperator()`, `calculateRowResult()`, `proFormatter`
- [x] Export `DisplayManager` class
- [x] Test: calculator operations display correctly

### Task 1B: AuditTrail

- [x] Create `ui/audit-trail.js`
- [x] Move `addAuditEntry()`, `createAuditActions()`, `clearAuditTape()`
- [x] Export `AuditTrail` class
- [x] Test: audit entries appear, actions work, clear empties

### Task 1C: ThemeCoordinator

- [x] Create `ui/theme-coordinator.js`
- [x] Move `toggleTheme()`, `setThemeColor()`, `setupThemePicker()`, `togglePaletteDropdown()`
- [x] Move `syncThemeColors()`, `getThemeUniforms()`, `getBackgroundMode()`, `VALID_THEMES`
- [x] Export `ThemeCoordinator` class
- [x] Test: theme switching, palette, aurora themes work

### Task 1D: ToastManager

- [x] Create `ui/toast-manager.js`
- [x] Move `showToast()`, `showUpdateToast()`, `toastTimeout`, `TOAST_DURATION_MS`
- [x] Export `ToastManager` class
- [x] Test: toasts appear and auto-dismiss

---

## Round 2: Create RowManager (after Round 1)

Depends on DisplayManager (needs `calculateRowResult`).

### Task 2: RowManager

- [x] Create `ui/row-manager.js`
- [x] Move `createRow()`, `addRow()`, `deleteRow()`, `createRowInput()`
- [x] Move `restorePercentageCards()`, `restoreScientificRows()`, `activateScientificMode()`
- [x] Move `ROW_BUILDERS`
- [x] Export `RowManager` class
- [x] Import `DisplayManager` from `./display-manager.js`
- [x] Test: add/delete rows, percentage cards, scientific mode

---

## Round 3: Wire UIManager Imports (sequential)

Edit `uimanager.js` once — add all imports and constructor initialization.

- [x] Add imports for all 5 new modules
- [x] Add constructor initialization:
  ```javascript
  this.displayManager = new DisplayManager();
  this.auditTrail = new AuditTrail();
  this.themeCoordinator = new ThemeCoordinator();
  this.rowManager = new RowManager();
  this.toastManager = new ToastManager();
  ```
- [x] Add delegation methods for each sub-manager

---

## Round 4: Remove Extracted Methods (sequential)

Edit `uimanager.js` once — remove all moved methods.

- [x] Remove DisplayManager methods
- [x] Remove AuditTrail methods
- [x] Remove ThemeCoordinator methods
- [x] Remove RowManager methods
- [x] Remove ToastManager methods
- [x] Verify remaining methods are pure coordination

---

## Round 5: Reorganize Services (parallel)

Both tasks can run simultaneously.

### Task 5A: Restructure directories

- [x] Create `services/core/` directory
- [x] Move `app.js`, `events.js`, `store.js`, `layout.js` to `services/core/`
- [x] Create `services/math/` directory
- [x] Move `calculator.ts` to `services/math/`
- [x] Update all import paths

### Task 5B: Update Service Worker

- [x] Add new files to `sw.js` PRECACHE_URLS:
  - `ui/display-manager.js`
  - `ui/audit-trail.js`
  - `ui/theme-coordinator.js`
  - `ui/row-manager.js`
  - `ui/toast-manager.js`

---

## Round 6: Verify (sequential)

- [x] Run `npm run build` — no errors
- [x] Run `npx playwright test` — all tests pass
- [ ] Run accessibility audit
- [ ] Test offline mode (service worker)
- [ ] Test on mobile viewport
- [ ] Test all 13 themes
- [ ] Test percentage types 1-4
- [ ] Test scientific mode
- [ ] Test audit trail
- [ ] Test copy result
- [ ] Test keyboard shortcuts
- [ ] Test paste support
- [ ] Test toast notifications
- [ ] Test PWA update toast
- [ ] Test responsive resize

---

## Execution Summary

| Round | Tasks          | Parallel? | Depends On |
| ----- | -------------- | --------- | ---------- |
| 1     | 1A, 1B, 1C, 1D | Yes       | —          |
| 2     | 2              | No        | Round 1    |
| 3     | Wire imports   | No        | Round 2    |
| 4     | Remove methods | No        | Round 3    |
| 5     | 5A, 5B         | Yes       | Round 4    |
| 6     | Verify         | No        | Round 5    |

---

## Round 7: Feature Enhancements (completed)

- [x] Brainstorm and design Row Naming Feature (scientific mode)
- [x] Brainstorm and design Main Display Copy Feature
- [x] Implement Row Naming Feature
  - [x] Build `.row-name-wrapper` DOM structure in `ui/uimanager.js`
  - [x] Wire up span/input click, Enter, Blur, and Escape behavior
  - [x] Style row name layout and transitions in `ui/styles.css`
- [x] Implement Main Display Copy Feature
  - [x] Restructure main display in `index.html` to add `.display-copy-btn` and `#main-display-value`
  - [x] Refactor `ui/display-manager.js` to target `.display-value` without breaking the DOM
  - [x] Wire copy action and SVG injection in `ui/uimanager.js`
  - [x] Style button positioning, active scale, and hover fade-in in `ui/styles.css`
- [x] Verify everything
  - [x] Run `npm run build` — compiles cleanly
  - [x] Run `npm run test:unit` — 13/13 tests pass
- [x] Implement Changelog Popup Feature (Subagent 3)
  - [x] Create `public/changelog.json` containing features and improvements
  - [x] Add dynamic `#changelog-overlay` DOM markup to `index.html`
  - [x] Implement `ChangelogModal` class in `ui/ui.js` with focus trap, Esc close, and localStorage tracking
  - [x] Style headings, lists, and layout transitions in `ui/styles.css`
  - [x] # Verify build and unit tests pass cleanly

# Refactor Calculator Codebase Tasks

## Phase 1: Decompose UIManager

- [ ] Task 1: Extract DisplayManager
- [ ] Task 2: Extract AuditTrail
- [ ] Task 3: Extract ThemeCoordinator
- [ ] Task 4: Extract RowManager

## Checkpoint 1

- [ ] Ensure `ui/uimanager.js` acts only as a thin orchestrator
- [ ] Build succeeds: `npm run build`
- [ ] All tests pass: `npm run test:unit` and `npm run test:e2e`

## Phase 2: Resolve Core Cohesion

- [ ] Task 5: Reorganize Core Services (`services/app.js`, `services/events.js`, `services/store.js`, `services/layout.js`, `services/pwa.js` -> `services/core/`)
- [ ] Task 6: Reorganize Math Services (`services/calculator.ts` -> `services/math/`)
- [ ] Task 7: Reorganize UI Rendering (`ui/renderer.js`, `ui/eye-tracker.js` -> `ui/rendering/` and move `uimanager.js` + newly extracted managers to `ui/managers/`)
- [ ] Update `index.html` external script references
- [ ] Update all JS file imports

## Checkpoint 2

- [ ] Build succeeds: `npm run build`
- [ ] All tests pass: `npm run test:unit` and `npm run test:e2e`
- [ ] Graph analysis verifies the cohesion issues are fixed: `graphify update .`
  > > > > > > > c12009ab974d5d9ebd581a44ea1289ad3d07ef71
