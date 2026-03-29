# Requirements: Calculator Efficiency Refactor

## Objective
Optimize the calculator for performance, size, and maintainability while preserving all existing logic and visual identity.

## 1. Performance Optimizations
- **[REQ-P1] Eliminate Layout Thrashing:** Refactor `fitDisplayText` to avoid synchronous read-write cycles (looping `scrollWidth` checks). Explore `ResizeObserver` or pre-calculating character widths.
- **[REQ-P2] Source-of-Truth State Management:** Replace DOM scraping in `saveState` with a centralized JavaScript state object that updates on input.
- **[REQ-P3] Efficient DOM Updates:** Implement a batching mechanism (e.g., `requestAnimationFrame`) for UI updates to ensure only one DOM write occurs per frame.
- **[REQ-P4] Eye-Tracking Optimization:** Offload pupil positioning logic to CSS variables updated via JS, reducing the amount of work done in the `mousemove` event handler.

## 2. Asset & Build Optimizations
- **[REQ-B1] Index.html Size Reduction:** Extract inlined SVGs from `index.html` into an external SVG sprite sheet or separate files to improve parsing speed.
- **[REQ-B2] Automated PWA Management:** Integrate `vite-plugin-pwa` to replace manual `sw.js` management and the `postbuild.js` script.
- **[REQ-B3] Asset Hashing:** Enable filename hashing in Vite for better cache-busting, relying on the PWA plugin for service worker updates.
- **[REQ-B4] Library Optimization:** Switch from CDN scripts to npm-managed packages. Use the `mathjs/number` entry point where possible and refine the lazy-loading of MathLive.

## 3. Maintainability & Code Quality
- **[REQ-M1] Architectural Clean-up:** Ensure strict separation between the Presentation (UI), Business Logic (Services), and Data (State) layers.
- **[REQ-M2] Build Process Modernization:** Remove redundant scripts and leverage Vite's native capabilities for asset handling.

## Non-Functional Requirements
- **Logic Preservation:** Calculation results and edge-case handling must remain identical to the current version.
- **UI Preservation:** The visual appearance, animations, and layouts must remain unchanged across all supported screen sizes.
- **Accessibility:** Maintain or improve current ARIA roles and keyboard navigation.
