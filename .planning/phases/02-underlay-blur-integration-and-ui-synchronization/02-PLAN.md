# GSD-PLAN-02: Underlay Blur Integration and UI Synchronization

**Objective:** Establish the multi-pass blur and coordinate visual state syncing between the DOM and the WebGL renderer to achieve 100% visual parity with the legacy CSS implementation.

---

- [ ] **P-02-01: Core Blur Implementation** - Implement the core 4-pass Kawase blur effect using a "ping-pong" FBO technique.
    - [ ] **Task 1:** Create `tests/phase-02.spec.js` for automated validation.
    - [ ] **Task 2:** Update `primitive.vert` and `primitive.frag` with the Kawase blur and pass-through shaders respectively.
    - [ ] **Task 3:** Modify `renderer.js` and `context.js` to implement the 4-pass blur logic, including FBO creation and the ping-pong rendering loop.
- [ ] **P-02-02: Theme Synchronization Bridge** - Create a bridge to synchronize theme colors from CSS Custom Properties to the WebGL shaders.
    - [ ] **Task 1:** Create a new `services/theme.js` module to read CSS Custom Properties using `getComputedStyle`.
    - [ ] **Task 2:** Update `primitive.frag` to accept theme uniforms and integrate the `theme.js` module into `renderer.js` to pass the values.
- [ ] **P-02-03: Resizing and Verification** - Ensure the WebGL canvas and blur effect handle resizing correctly and verify the complete implementation.
    - [ ] **Task 1:** Update `renderer.js` to include a `ResizeObserver` that correctly updates the canvas, viewport, and FBOs on resize.
    - [ ] **Task 2:** Checkpoint: Verify that the blur effect is working, synchronized with the theme, and handles resizing, achieving visual parity with the original CSS.
