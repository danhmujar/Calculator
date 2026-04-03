# Phase 1: Separation and Cleanup - Research Findings

## Technical Objective
Eliminate z-index and WebGL clipping regressions caused by legacy CSS filters and improper DOM placement.

## Codebase Analysis
### 1. `index.html` Structure
- **Current State:** The WebGL underlay canvas is typically pushed inside the main layout wrapper or appended sequentially where it gets clipped by `transform` or `filter` bounds on parent nodes.
- **Planner Action Required:** Ensure the DOM explicitly structures the canvas as a sibling to the calculator layout wrapper (e.g. at the `<body>` level or inside a flat, non-composited wrapper).
```html
<body>
  <canvas id="webgl-underlay" aria-hidden="true"></canvas>
  <main class="calculator-ui">...</main>
</body>
```

### 2. `ui/styles.css` Stacking Threats
- **Identified Threats:** Any `.calculator-ui` or `.card` classes that utilize:
  - `backdrop-filter: blur`
  - `mix-blend-mode`
  - `transform: translate3d`
  - `opacity` (< 1.0)
- **Why they threaten WebGL:** The browser creates a nested Stacking Context. This forces children (and any fixed/absolute layers inside them) to be clipped to that layer, preventing an underlay from spilling fullscreen or breaking z-index ordering across themes.
- **Planner Action Required:** Identify and delete all `backdrop-filter` lines. Rely entirely on the ping-pong blur FBO implemented in WebGL for the frosted glass effect. Add `pointer-events: none; z-index: -1; position: fixed; inset: 0;` to the canvas object.

## State Management Check
- This phase does not execute logic restructuring; it is purely structural markup and CSS rules.

## Validation Architecture
- **Validation Goal:** Playwright tests must verify that the element `<canvas id="webgl-underlay">` is visibly present, spans the window dimensions, does not trap pointers, and that the `.calculator-ui` element has exactly `backdrop-filter: none`.
