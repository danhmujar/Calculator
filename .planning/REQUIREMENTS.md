# Requirements

## Success Criteria (Must-Haves)
1. **Remove CSS Composition**: All legacy CSS `backdrop-filter` utilities must be completely stripped out in favor of the WebGL underlay blur pass.
2. **Architecture Separation**: The WebGL `<canvas>` and standard DOM UI must live as sibling nodes on the document, maintaining a strict flat `z-index` layering hierarchy.
3. **Toggle Stability**: Z-index stacking contexts must remain stable across all dynamic states. Expanding the scientific mode and changing CSS themes cannot visually break the layering.
4. **Strict Visual Parity**: WebGL rendered aurora gradients and blurred edges must visually match the exact output of the original CSS implementations perfectly.
5. **Clean Verification**: All parity-testing scaffolding must be removed and obsolete files deleted. The Playwright UI test suite must reliably pass on the integration branch.

## Nice-to-Haves
- Smooth transitions built-in to the shader program when CSS constants animate.

## Constraints
- **Stack Optimization**: No heavy 3D rendering wrappers (e.g., Three.js, Babylon) are permitted. We must remain on raw vanilla WebGL 2.0.
- **Responsiveness**: The WebGL underlay must correctly redraw its render target constraints across all scaling variables (`ResizeObserver` and `devicePixelRatio` scaling).
