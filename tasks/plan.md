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
| Risk | Impact | Mitigation |
|------|--------|------------|
| Circular dependencies during extraction | Medium | Keep `UIManager` as the hub that instantiates the extracted managers and passes dependencies downward via constructor injection. |
| Broken PWA caching | High | Vite PWA `globPatterns` captures `**/*.js`, but we must ensure `index.html` `<script>` paths correctly point to the moved `core/app.js` to avoid runtime 404s. |
| WebGL Context race conditions | Medium | `DisplayManager` and `ThemeCoordinator` both rely on `WebGLRenderer`. They must receive the `webglRenderer` instance or queue renders via `renderer.schedule()` as currently done. |

## Open Questions
- Should `uimanager.js` be moved to `ui/managers/uimanager.js` or stay in `ui/uimanager.js`? (Plan assumes leaving it in `ui/managers/` for consistency, but updating imports accordingly).
