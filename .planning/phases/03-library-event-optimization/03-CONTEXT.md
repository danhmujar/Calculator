# Phase 03: Library & Event Optimization - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 focuses on fine-tuning the runtime performance and bundle footprint of the calculator. This includes optimizing third-party library usage (mathjs and MathLive), refactoring event handling to improve Interaction to Next Paint (INP), and cleaning up the application logic by modularizing the eye-tracking feature.

</domain>

<decisions>
## Implementation Decisions

### Library Optimization
- **D-01: Lightweight Math Engine:** Switch to the `mathjs/number` entry point to exclude heavy data types (BigNumber, Complex, Matrix) while retaining all standard scientific math functions.
- **D-02: Lazy-Load MathLive:** Move the `mathlive` import from the main bundle to a dynamic `import()` call triggered only when Scientific Mode is activated.

### Event & UI Refactoring
- **D-03: Regional Event Delegation:** Refactor fragmented listeners in `app.js` into delegated handlers on regional containers (e.g., `#keypad`, `#sidebar`). Use `event.target.closest()` to ensure reliable target detection for nested elements.
- **D-04: Modular Eye-Tracking:** Move the "Chameleon" eye-tracking logic into a dedicated `ui/eye-tracker.js` module. Continue using `requestAnimationFrame` and CSS variables for GPU acceleration.
- **D-05: App Layer Cleanup:** Remove redundant event listeners and initialization logic from `app.js` to improve maintainability and reduce the file's footprint.

</decisions>

<canonical_refs>
## Canonical References

### Core Application
- `services/app.js` — The primary file for event listener refactoring and MathLive lazy-loading.
- `ui/renderer.js` — Used for batching UI updates and eye-tracking movement.
- `ui/styles.css` — Contains the CSS variables (`--pupil-x`, `--pupil-y`) used for eye-tracking.

### Research
- `.planning/phases/03-library-event-optimization/03-RESEARCH.md` — Technical guide for library builds and delegation patterns.

</canonical_refs>

<code_context>
## Existing Code Insights

### Interaction Points
- **Scientific Mode Transition:** The `activateScientificMode` function in `app.js` is the canonical location to trigger the dynamic import of `mathlive`.
- **Keypad Interaction:** The `#keypad` element is already a stable container but currently hosts individual listeners for some buttons; this is the primary target for delegation refactoring.

### Established Patterns
- **Renderer Batching:** The `renderer.schedule()` method is the standard way to queue DOM and style updates.
- **State Management:** All state should still flow through `services/store.js` even during event refactoring.

</code_context>

<specifics>
## Specific Ideas
- **MathLive Loader:** Implement a simple "loading..." state or spinner if the network is slow during the first scientific mode activation.
- **Eye-Tracker API:** The new `ui/eye-tracker.js` should export a clean `initEyeTracking(container)` or similar initialization function.

</specifics>

<deferred>
## Deferred Ideas
- **Framework Migration:** Any move to React/Vue remains out of scope for this optimization phase.
- **Web Workers for Math:** Offloading math evaluation to a worker is deferred unless `mathjs/number` proves insufficient for responsiveness.

</deferred>

---

*Phase: 03-library-event-optimization*
*Context gathered: 2026-03-30*
