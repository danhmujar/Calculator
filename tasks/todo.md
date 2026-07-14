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
