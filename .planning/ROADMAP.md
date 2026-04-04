# Integration Roadmap: WebGL Underlay Finalization

## Phase 1: Separation and Cleanup (DOM & CSS Optimization)
- **Objective:** Separate the WebGL underlay fully by eliminating legacy CSS interactions and stabilizing the stacking context.
- **Outcomes:** 
  - Complete removal of `backdrop-filter` and conflicting CSS blend modes on the calculator DOM.
  - Sibling segregation of the `<canvas id="webgl-underlay">` and DOM `<main>`, forcing independent stacking contexts.
  - Verify pointer events are successfully neutralized (`pointer-events: none`) preventing the canvas from hijacking clicks.

## Phase 2: Underlay Blur Integration and UI Synchronization
- **Objective:** Establish the multi-pass blur and coordinate visual state syncing between the DOM and the WebGL renderer.
- **Outcomes:**
  - [UI-SYNC-01] Connect the `ResizeObserver` correctly so that expanding the scientific mode explicitly triggers shader resize passes without destroying the z-index.
  - [UI-SYNC-02] Achieve 100% Visual Parity: The dual-FBO rendering pass closely matches the original CSS Aurora configurations.

## Phase 3: Verification & Parity Artifact Purge
- **Objective:** Strip dead code related to historical transitions and validate end-state against requirements.
- **Outcomes:**
  - Removal of side-by-side parity rendering hacks remaining in the codebase.
  - Automated suite validation: The specific "Underlay Pattern" regressions documented in Playwright resolve cleanly against the finalized z-index structures.
**Plans:** 1 plans (COMPLETED)

Plans:
- [x] 03-01-PLAN.md — Purge legacy parity checks, ensure backdrop-filter removal, and validate Playwright test suites.

### Phase 4: Optimization and UI Refinement

**Goal:** Optimize the WebGL rendering pipeline for better performance, refine the visual language of the "Glass" UI elements for better legibility, and implement smooth transitions for theme state changes.
**Requirements**: UI-REF-01, UI-REF-02, UI-REF-03
**Depends on:** Phase 3
**Plans:** 2 plans

Plans:
- [ ] 04-01-PLAN.md — Theme Transition and WebGL Rendering Polish
- [ ] 04-02-PLAN.md — Glass Opacity and UI Character Polish
