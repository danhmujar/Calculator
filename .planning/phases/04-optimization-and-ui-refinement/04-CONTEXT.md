# Phase 4: Optimization and UI Refinement - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Optimize the WebGL rendering pipeline for better performance, refine the visual language of the "Glass" UI elements for better legibility, and implement smooth transitions for theme state changes.
</domain>

<decisions>
## Implementation Decisions

### Theme Interpolation

- **D-01 (Smooth Transitions):** The WebGL renderer **MUST NOT** snap colors when a theme change is detected. It must interpolate between the old and new theme values (colors, gradients) over a duration of **~400ms**.
- **D-02 (Easing):** All theme-related color interpolations **MUST** use a **Quadratic Out** easing function to ensure the transitions feel organic and consistent with existing UI animations.

### Glass Effect & Opacity (Option B: Frosted)

- **D-03 (Increased Opacity):** To improve legibility and provide a more premium "frosted" feel, the opacity of all glass-morphic elements (Panels, Cards, Modals, and FABs) **MUST** be increased.
- **D-04 (Panel Opacity):** For panels and cards in WebGL mode, the `color-mix` ratio **MUST** be increased from 65% to **85%** (e.g., `color-mix(in srgb, var(--panel-bg) 85%, transparent)`).
- **D-05 (Variable Opacity):** The `--glass-bg` and `--modal-glass-bg` variables in `ui/styles.css` **MUST** be updated to a target opacity of **0.75 to 0.85** (e.g., `rgba(..., 0.82)`).

### Character & Eye Tracking Polish

- **D-06 (Refinement):** General "life" improvements for the chameleon eyes. Implement random **Blink Animations** and add a small amount of **Inertia/Smoothing** to the tracking movement so it feels less robotic.

### the agent's Discretion

- The exact implementation of the `TransitionManager` within the WebGL renderer.
- The precise values for blink frequency and inertia timing.
- Optimization of SVG sprites if necessary to reduce HTML bloat during the refinement.
  </decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Assets

- `ui/webgl/renderer.js` — Main WebGL rendering loop and uniform management.
- `services/theme.js` — Theme color extraction and bridge logic.
- `ui/styles.css` — Global variable definitions for glass and colors.
- `ui/eye-tracker.js` — Eye tracking logic.
  </canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- The `Quadratic Out` easing function is already implemented in `ui/webgl/shaders.js` (for button animations) and can be mirrored or shared in JS.
- `layoutManager` in `services/layout.js` handles non-blocking geometry sync.

### Established Patterns

- Theme colors are read via `getComputedStyle` in `services/theme.js`.
  </code_context>

<specifics>
## Specific Ideas
- Move the theme color parsing and interpolation logic into a dedicated module or enhance the `renderer.js` to handle a transition state.
</specifics>

<deferred>
## Deferred Ideas
- **Unit Testing:** Introduction of Vitest for core math logic is deferred to a future maintenance phase to keep Phase 4 focused on UI/UX polish.
- **CSS Modularization:** Splitting the 2,300+ line `styles.css` is deferred to favor a smaller "Artifact Purge" scope.
</deferred>

---

_Phase: 04-optimization-and-ui-refinement_
_Context gathered: 2026-04-04_
