# Requirements: Calculator Architectural Hardening & WebGL Migration

## Objective
The objective is to refactor the monolithic application layer and optimize state management, followed by a complete migration to a high-performance Raw WebGL 2.0 rendering layer to improve maintainability, performance, and visual fidelity.

## 1. Architectural Refactoring
- **[REQ-ARCH-01] Monolith Decomposition:** Refactor the 1,200-line `services/app.js` into distinct, single-responsibility services:
  - `UIManager`: Handles DOM/Canvas coordination.
  - `CalculatorService`: Core calculation logic and scientific row management.
  - `PWAManager`: Service worker registration and update logic.
- **[REQ-ARCH-02] Render-Agnostic Store:** Ensure `services/store.js` is independent of any rendering technology (DOM or WebGL).
- **[REQ-ARCH-03] Modularized Events:** Refactor event delegation logic out of IIFEs in `ui/ui.js` to be properly exported and testable.

## 2. State Management Optimization
- **[REQ-STORE-01] Efficient State Reads:** Optimize `services/store.js` to eliminate O(N) deep-cloning on every state access. Implement shallow cloning or immutable data patterns.
- **[REQ-STORE-02] Segmented State:** Segment state into "transient" (non-persisted) and "persistent" parts to optimize performance.

## 3. Reliability & Bug Fixes
- **[REQ-BUG-01] Robust Restoration:** Fix scientific row restoration race conditions by removing `setTimeout` logic and implementing a more reliable, event-driven or promise-based initialization sequence.
- **[REQ-BUG-02] Mobile Scientific Mode:** Fix the issue where scientific mode is skipped on mobile restoration because the sidebar is closed.
- **[REQ-BUG-03] LRU Cache:** Implement a Least Recently Used (LRU) cache or clear strategy for any intermediate text measurement caches in `ui/renderer.js`.

## 4. Security & Hardening
- **[REQ-SEC-01] InnerHTML Elimination:** Replace all instances of `innerHTML` with `document.createElement` or safe template literal approaches.
- **[REQ-SEC-02] MathJS Security:** Configure `math.js` with restrictive security settings and ensure expression evaluation is isolated.

## 5. WebGL 2.0 Foundation
- **[REQ-WGL-01] WebGL 2.0 Context Initialization:** Initialize a raw WebGL 2.0 canvas and main rendering loop.
- **[REQ-WGL-02] GLSL Shader Development:** Develop custom vertex and fragment shaders for UI primitives (buttons, rows, background).
- **[REQ-WGL-03] Dynamic Vertex Buffers:** Implement optimized vertex buffer management for dynamic calculator content.

## 6. WebGL Advanced Rendering
- **[REQ-WGL-04] Texture Atlas Typography:** Generate a texture atlas for MathLive/KaTeX glyphs to enable hardware-accelerated text rendering.
- **[REQ-WGL-05] Batch Rendering:** Implement a batch renderer to minimize draw calls for 100+ items.
- **[REQ-WGL-06] Animation Interpolation:** Move all UI animations (transitions, layout shifts) to GPU-side interpolation.

## 7. Manual Verification & Parity
- **[REQ-VER-01] Side-by-Side Validation:** Implement a toggle or split-view to compare the WebGL layer against the legacy DOM layer.
- **[REQ-VER-02] Manual Visual Audit:** Perform a comprehensive manual audit of every calculator screen and interaction to ensure zero visual regressions.
- **[REQ-VER-03] Touch & Gesture Verification:** Verify touch response and gesture support on physical mobile devices.

## 8. Test Coverage
- **[REQ-TEST-01] Modular Service Testing:** Update and expand the test suite to verify the functionality of the new modular services in isolation and integration.
- **[REQ-TEST-02] WebGL Stress Testing:** Implement performance stress tests for 100+ scientific rows in WebGL mode.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-ARCH-01 | Phase 6 | Pending |
| REQ-ARCH-02 | Phase 6 | Pending |
| REQ-ARCH-03 | Phase 6 | Pending |
| REQ-STORE-01 | Phase 6 | Pending |
| REQ-STORE-02 | Phase 6 | Pending |
| REQ-BUG-01 | Phase 6 | Pending |
| REQ-BUG-02 | Phase 6 | Pending |
| REQ-BUG-03 | Phase 6 | Pending |
| REQ-SEC-01 | Phase 6 | Pending |
| REQ-SEC-02 | Phase 6 | Pending |
| REQ-WGL-01 | Phase 7 | Complete |
| REQ-WGL-02 | Phase 7 | Complete |
| REQ-WGL-03 | Phase 7 | Complete |
| REQ-WGL-04 | Phase 8 | Complete |
| REQ-WGL-05 | Phase 8 | Pending |
| REQ-WGL-06 | Phase 9 | Pending |
| REQ-VER-01 | Phase 10 | Pending |
| REQ-VER-02 | Phase 10 | Pending |
| REQ-VER-03 | Phase 10 | Pending |
| REQ-TEST-01 | Phase 6 | Pending |
| REQ-TEST-02 | Phase 9 | Pending |
