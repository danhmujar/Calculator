# Project Research: Stack

## Recommended Stack for WebGL Underlays
- **Rendering API**: WebGL 2.0. Recommended over WebGL 1.0 for better texture support (like floating-point textures for precise blur passes) and standard usage in modern devices (99% support).
- **DOM Integration**: Vanilla DOM overlaid on absolutely positioned `<canvas>` elements.
- **State Syncing**: `ResizeObserver` is heavily recommended over `window.onresize` to accurately sync the DOM canvas size with the virtual resolution, particularly for the multi-pass compositor.

## What NOT to Use
- **Heavy Abstraction Libraries (Three.js/Babylon)**: Given this is a simple underlay for a calculator, bundling a massive 3D engine like Three.js adds unnecessary megabytes to a highly optimized PWA. Raw WebGL wrapper libraries or direct API usage (as started) are preferred.
- **CSS `backdrop-filter` combined with WebGL**: Do not mix them. Let CSS handle DOM placement and let WebGL handle *all* pixel manipulations (blurs/gradients) to avoid triggering separate compositing layers in the browser engine, which tanks performance.
