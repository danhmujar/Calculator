# Roadmap: Calculator Efficiency Refactor

## Phase 1: Performance-First Core (State & Rendering)
**Goal:** Establish a solid foundation with efficient state management and rendering.

**Plans:** 3 plans

- [ ] 01-01-PLAN.md — Core State & Persistence
- [ ] 01-02-PLAN.md — Performance Rendering & Canvas
- [ ] 01-03-PLAN.md — App Layer Refactor

## Phase 2: Asset & Build Modernization
**Goal:** Reduce file sizes and automate the build/PWA pipeline.

- [P2-T1] Externalize Assets: Extract inline SVGs from `index.html` into a separate sprite sheet or asset folder.
- [P2-T2] Modernize PWA & Build: Integrate `vite-plugin-pwa`, enable asset hashing, and remove `scripts/postbuild.js`.
- [P2-T3] Dependency Overhaul: Migrate from CDN scripts to npm-managed packages (`mathjs`, `mathlive`) for better bundling and tree-shaking.

## Phase 3: Library & Event Optimization
**Goal:** Fine-tune interactions and third-party library usage.

- [P3-T1] Optimize Math Engines: Refactor `mathjs` usage to use a custom, lightweight build. Refine MathLive's lazy-loading strategy.
- [P3-T2] Optimize Eye-Tracking: Rewrite the pupil positioning logic to use CSS variables for smoother performance and cleaner JS.
- [P3-T3] Refactor Events: Consolidate event listeners and ensure efficient event delegation where applicable.

## Phase 4: Final Validation & Polish
**Goal:** Ensure absolute fidelity to the original logic and UI.

- [P4-T1] Performance Audit: Conduct a full Lighthouse audit and ensure zero regressions in interactivity.
- [P4-T2] Regression Testing: Run all Playwright tests to verify calculation logic and UI behavior.
- [P4-T3] Accessibility Check: Run Axe-core audits to ensure ARIA and keyboard compliance are maintained.
