# Phase 1: Separation and Cleanup (DOM & CSS Optimization) - UI Design Contract

## Implementation Guardrails

This phase executes a structural refactor pushing the WebGL underlay effectively behind the core interface. Because it touches presentation files (`ui/styles.css` and `index.html`), the following design guardrails apply:

### Dimension 1: Visual and Layout Invariants

- **Layout Consistency:** Re-parenting or extracting the DOM nodes inside `index.html` MUST NOT alter the grid, flexbox parameters, or mobile padding of the existing `<main>` layout whatsoever.
- **Backdrop Abstraction:** The `.calculator-ui` layer relies on frosted glass effects. The old `backdrop-filter` rule is removed entirely. The transparency alpha level in the DOM (`background: rgba(...)`) must be preserved exactly as it currently is so the WebGL underlay can blur correctly behind it.

### Dimension 2: Accessibility (A11y)

- **Canvas Interaction:** The newly separated `<canvas id="webgl-underlay">` element MUST carry `aria-hidden="true"`.
- **Pointer Insulation:** The canvas wrapper must have `pointer-events: none` applied strictly in CSS so it never traps keyboard focus or touch inputs meant for the calculator buttons.

### Dimension 3: Device Adaptability

- **Scaling:** The canvas sizing must inherently respect mobile viewports and dynamically stretch 100% of the screen dimension, exactly matching the `body` tags.

## Final Approval Check

By stripping mix-blend modes and CSS filters out naturally, some UI overlapping might appear momentarily broken if the WebGL does not render. The solid flat color fallback (`D-01` in Context) will serve as the default structural background until the GPU rendering takes completely over in Phase 2.
