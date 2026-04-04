# Phase 2: Underlay Blur Integration and UI Synchronization - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the multi-pass blur and coordinate visual state syncing between the DOM and the WebGL renderer to achieve 100% visual parity with the legacy CSS implementation.
</domain>

<decisions>
## Implementation Decisions

### Blurring Strategy
- **D-03 (Algorithm):** The renderer **MUST** implement a **Kawase Blur** for the multi-pass blur effect. This is a performance-focused choice to ensure a smooth user experience.
- **D-04 (Implementation):** The blur effect **MUST** be implemented using a 4-pass approach, "ping-ponging" between two dedicated Frame Buffer Objects (FBOs) to generate the final result.

### Visual Parity & State Syncing
- **D-05 (Source of Truth):** The "Aurora" theme's defining values (colors, gradients, etc.) **MUST** remain as CSS Custom Properties in the stylesheet to serve as the single source of truth.
- **D-06 (Synchronization):** A dedicated "theme bridge" module **MUST** be created. It is responsible for reading the CSS Custom Properties at runtime via `getComputedStyle()` and passing them to the WebGL fragment shader as `uniforms`. This ensures the WebGL rendering stays in sync with the CSS definitions.

### Resizing and Integration
- **D-07 (Resize Logic):** The main WebGL renderer module **MUST** own the `ResizeObserver` callback. When a resize is detected, it must perform the following actions in order: 1) Update the canvas element's dimensions, 2) Call `gl.viewport()`, and 3) Recreate the FBOs used for the blur effect at the new dimensions.

### the agent's Discretion
- The precise implementation of the `theme-bridge` module.
- The specific code structure within the fragment shader for handling the blur passes and applying the theme uniforms.
- How the `ResizeObserver` is initialized and attached to the correct DOM element.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

*No new research was required for this phase. Decisions are based on established best practices and prior project context.*
</canonical_refs>
