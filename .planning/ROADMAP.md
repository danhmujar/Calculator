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
  - Connect the `ResizeObserver` correctly so that expanding the scientific mode explicitly triggers shader resize passes without destroying the z-index.
  - Achieve 100% Visual Parity: The dual-FBO rendering pass closely matches the original CSS Aurora configurations.

## Phase 3: Verification & Parity Artifact Purge
- **Objective:** Strip dead code related to historical transitions and validate end-state against requirements.
- **Outcomes:**
  - Removal of side-by-side parity rendering hacks remaining in the codebase.
  - Automated suite validation: The specific "Underlay Pattern" regressions documented in Playwright resolve cleanly against the finalized z-index structures.
