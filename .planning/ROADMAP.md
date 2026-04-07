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
- [x] 04-01-PLAN.md — Theme Transition and WebGL Rendering Polish
- [x] 04-02-PLAN.md — Glass Opacity and UI Character Polish

## Phase 5: About Modal and Main Calculator Transparency Fix [✅ Completed]

**Goal:** Fix WebGL blur underlay on the about-modal and resolve the opaque background masking issue over the main calculator display caused by a CSS selector typo.
**Requirements**: REQ-01, REQ-02
**Depends on:** Phase 4
**Plans:** 1 plans

Plans:
- [x] 05-01-PLAN.md — Fix WebGL blur underlay on about-modal and resolve the opaque background masking over main calculator display

### Phase 6: Implement BTS Theme

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 5
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 6 to break down)

### Phase 7: WebGL Aurora and Glass Effects

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 6
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 7 to break down)

### Phase 8: WebGL Theme System Migration

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 7
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 8 to break down)

### Phase 9: WebGL Component Transitions

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 8
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 9 to break down)
