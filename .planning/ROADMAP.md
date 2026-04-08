# Integration Roadmap: WebGL Underlay Finalization

## Phase 1: Separation and Cleanup (DOM & CSS Optimization) [✅ Completed]
- **Objective:** Separate the WebGL underlay fully by eliminating legacy CSS interactions and stabilizing the stacking context.

## Phase 2: Underlay Blur Integration and UI Synchronization [✅ Completed]
- **Objective:** Establish the multi-pass blur and coordinate visual state syncing.

## Phase 3: Verification & Parity Artifact Purge [✅ Completed]
- **Objective:** Strip dead code related to historical transitions and validate end-state.

## Phase 4: Optimization and UI Refinement [✅ Completed]
- **Objective:** Optimize WebGL rendering, refine "Glass" UI, and implement smooth JS-driven theme transitions.

## Phase 5: About Modal and Main Calculator Transparency Fix [✅ Completed]
- **Objective:** Fix WebGL blur underlay on about-modal and resolve background masking issues.

## Phase 6: Implement BTS Theme [✅ Completed]
- **Objective:** Integrate BTS "Borahae" theme with WebGL procedural bubbles and background textures.

## Phase 7: PWA Update Notifications
- **Objective:** Implement a Service Worker-based update notification system for GitHub Pages.
- **Outcomes:**
  - Automated `version.json` generation.
  - Service Worker logic for detecting updates.
  - Integration with existing `update-toast` UI.
**Plans:** 3 plans

Plans:
- [ ] 07-01-PLAN.md — Build script and version manifest setup
- [ ] 07-02-PLAN.md — Service Worker implementation for version polling
- [ ] 07-03-PLAN.md — UI toast integration and cache-busting logic
