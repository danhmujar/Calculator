# Project: Calculator Architectural Hardening & WebGL Migration

## Context
The project is a client-side calculator (Scientific + Percentage) built with Vanilla JavaScript, Vite, and external math libraries (Math.js, MathLive). After initial performance and asset optimizations, the codebase now requires structural refactoring to handle increasing complexity and a complete migration to a Raw WebGL 2.0 rendering layer for ultimate performance.

## Goals
- **Primary:** Refactor the monolithic application layer into modular, testable services.
- **Rendering:** Migrate from DOM-heavy rendering to a high-performance Raw WebGL 2.0 implementation.
- **Efficiency:** Eliminate redundant state processing and race conditions in the restoration logic.
- **Manual Verification:** Ensure 100% visual and functional parity between the legacy DOM implementation and the new WebGL layer through rigorous manual testing.

## Success Criteria
- **Modularity:** 100% of `services/app.js` logic moved to single-responsibility services.
- **Performance:** WebGL rendering loop maintains 60 FPS even with 100+ complex scientific rows.
- **Accuracy:** All mathematical expressions rendered in WebGL match the original MathLive/KaTeX output exactly.
- **Manual Verification Passed:** Every calculator feature (scientific modes, history, settings) has been manually verified for visual and functional regression.

## Constraints
- **Raw WebGL 2.0 Only:** No external rendering libraries (e.g., Three.js, OGL, PixiJS). All shader and buffer management must be native WebGL 2.0.
- **MANDATORY Runnability:** Every phase must end in a "Runnable" state. 
- **Verifiability:** The user must be able to manually verify the app via `npm run dev` at the end of every phase.

## Brand/UI
- Preserve existing UI (no visual changes, even after WebGL migration).
- Maintain responsiveness across mobile and desktop.

## Stack
- **Frontend:** Vanilla JS, CSS (PostCSS/Tailwind-like variables)
- **Rendering:** Raw WebGL 2.0
- **Math:** Math.js, MathLive
- **Build:** Vite
- **Testing:** Playwright, Vitest, Manual Verification
