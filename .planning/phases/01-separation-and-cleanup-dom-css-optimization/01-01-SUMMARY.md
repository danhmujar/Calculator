---
phase: 01
plan: 1
subsystem: DOM & CSS Optimization
tags: [webgl, css, layout, optimization]
requires: []
provides: [webgl-underlay, flat-layout]
affects: [uimanager, styles]
tech-stack.added: []
tech-stack.patterns: [Underlay Pattern]
key-files.modified: [ui/uimanager.js, ui/styles.css]
key-files.created: []
key-decisions:
  - Appending WebGL canvas dynamically to document.body instead of querying index.html to decouple layout initialization.
requirements-completed: [REQ-1, REQ-2]
---

# Phase 01 Plan 1: Separation and Cleanup (DOM & CSS Optimization) Summary

Separated the WebGL `<canvas>` into an isolated stacking context as a direct sibling to `<main>` and completely eliminated legacy CSS `backdrop-filter` compositing to prevent Z-index regressions.

- Moved `<canvas id="webgl-underlay">` dynamic injection to `document.body.prepend()` in `ui/uimanager.js`.
- Added `aria-hidden="true"` attributes to the canvas for accessibility compliance.
- Safely stripped down all 21 matches of `backdrop-filter: blur(...)` across the entire `ui/styles.css` to prevent destructive double-compositing traps over the canvas.
- Re-architected `#webgl-underlay` and `.layout-container` CSS by adding static Z-indexes (`-1` for canvas, `1` alongside relative-positioning for `.layout-container`) respectively to assure safe rendering layering.

## Deviations from Plan

None - plan executed effectively, but using DOM injection modifications instead of querying raw strings per standard dynamic JS patterns (no `#webgl-underlay` physically existed inside `index.html`).

## Self-Check: PASSED
- `backdrop-filter` removed.
- Z-indexes configured properly.
- JS appends canvas efficiently.

Phase complete, ready for next step.
