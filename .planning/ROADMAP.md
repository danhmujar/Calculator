# Roadmap: Calculator Efficiency Refactor

## Phase 1: Performance-First Core (State & Rendering)
**Goal:** Establish a solid foundation with efficient state management and rendering.

**Plans:** 3 plans

- [x] 01-01-PLAN.md — Core State & Persistence
- [x] 01-02-PLAN.md — Performance Rendering & Canvas
- [x] 01-03-PLAN.md — App Layer Refactor

## Phase 2: Asset & Build Modernization (COMPLETED ✅)
**Goal:** Reduce file sizes and automate the build/PWA pipeline.

**Plans:** 3 plans

- [x] 02-01-PLAN.md — SVG Sprite Sheet
- [x] 02-02-PLAN.md — Dependency Migration
- [x] 02-03-PLAN.md — PWA Modernization

**Requirements:**
- [x] [P2-T1] Externalize Assets: Extract inline SVGs from `index.html` into a separate sprite sheet or asset folder.
- [x] [P2-T2] Modernize PWA & Build: Integrate `vite-plugin-pwa`, enable asset hashing, and remove `scripts/postbuild.js`.
- [x] [P2-T3] Dependency Overhaul: Migrate from CDN scripts to npm-managed packages (`mathjs`, `mathlive`) for better bundling and tree-shaking.

## Phase 3: Library & Event Optimization (COMPLETED ✅)
**Goal:** Fine-tune interactions and third-party library usage.

**Plans:** 3 plans

- [x] 03-01-PLAN.md — Library Optimization
- [x] 03-02-PLAN.md — Eye-Tracking Modularization
- [x] 03-03-PLAN.md — Event Delegation Refactor

**Requirements:**
- [x] [P3-T1] Optimize Math Engines: Refactor `mathjs` usage to use a custom, lightweight build. Refine MathLive's lazy-loading strategy.
- [x] [P3-T2] Optimize Eye-Tracking: Rewrite the pupil positioning logic to use CSS variables for smoother performance and cleaner JS.
- [x] [P3-T3] Refactor Events: Consolidate event listeners and ensure efficient event delegation where applicable.

## Phase 4: Final Validation & Polish (COMPLETED ✅)
**Goal:** Ensure absolute fidelity to the original logic and UI.

- [x] [P4-T1] Performance Audit: Conduct a full Lighthouse audit and ensure zero regressions in interactivity.
- [x] [P4-T2] Regression Testing: Run all Playwright tests to verify calculation logic and UI behavior.
- [x] [P4-T3] Accessibility Check: Run Axe-core audits to ensure ARIA and keyboard compliance are maintained.

## Phase 5: Animation Optimization
**Goal:** Optimize animations and rendering for consistent performance.

- [ ] [P5-T1] Refine Eye-Tracking: Optimize CSS-variable driven pupil positioning for hardware acceleration.
- [ ] [P5-T2] Display Rendering Tuning: Profile and optimize the canvas-based or font-based display rendering.
- [ ] [P5-T3] Animation Performance Audit: Ensure all transitions only use `transform` and `opacity` to avoid layout thrashing.
