# Project Research: Architecture

## Component Boundaries

- **DOM Container**: The native HTML UI (`<main>`, `<aside>`, `<button>`). Responsible entirely for pointer events, accessibility, and layout calculations.
- **WebGL Canvas Layer**: Placed in `z-index: -1` (or isolated stacking context). Controlled by `ui/webgl/renderer.js`. Rendered continuously or implicitly based on a requestAnimationFrame loop.

## Data Flow

- **Initialization**: Variables from CSS (e.g. `--primary-blue`) are extracted via `getComputedStyle()` upon app load/theme switch.
- **Uniform Mapping**: Extracted colors/dimensions are fed to the WebGL shader via `gl.uniform[x]`.
- **Composite Rendering Flow**:
  1. Draw background color/aurora gradients to Framebuffer A.
  2. Perform vertical/horizontal Gaussian blur from FBA to FBB if frosted glass is layered.
  3. Blit FBB mapped to a full-screen quad in the main rendering Context to appear behind the DOM.

## Build Order

1. Extract CSS and remove DOM Filters.
2. Establish Canvas structure alongside DOM container.
3. Hook up multipass FBO (Framebuffer Object) logic.
4. Pass variables, initialize blur, and finally link the ResizeObserver.
