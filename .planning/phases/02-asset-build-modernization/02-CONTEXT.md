# Phase 02: Asset & Build Modernization - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 focuses on transitioning the calculator's asset and build pipeline from a manual, CDN-based setup to a modern, automated, and optimized Vite-driven process. This includes externalizing SVGs, modernizing the PWA using `vite-plugin-pwa`, and migrating core libraries to npm-managed dependencies with a focus on tree-shaking and performance.

</domain>

<decisions>
## Implementation Decisions

### SVG Strategy
- **D-01:** **Manual Sprite Sheet:** All 24+ inline SVGs in `index.html` will be extracted into a single manual sprite sheet at `public/assets/sprites.svg`.
- **D-02:** **Symbol/Use Pattern:** Icons will be referenced in the UI using the `<symbol>` and `<use>` pattern to preserve CSS variable theming and reduce the initial HTML size.

### PWA & Build Strategy
- **D-03:** **vite-plugin-pwa Integration:** Replace the manual `sw.js` and `scripts/postbuild.js` with `vite-plugin-pwa` for automated service worker generation and lifecycle management.
- **D-04:** **Prompt for Update:** The PWA will use the "Prompt for Update" strategy (a toast notification) to ensure users can refresh at a safe time, avoiding data loss during active sessions.
- **D-05:** **Re-enable Asset Hashing:** Re-enable Vite's default filename hashing (`[name].[hash].js`) to ensure reliable browser cache-busting.

### Library Migration
- **D-06:** **npm Migration:** Transition from CDN-loaded libraries to npm-managed packages for `mathjs` and `mathlive`.
- **D-07:** **Custom Bundling:** Use tree-shaking and custom bundling (e.g., `mathjs/number`) to minimize the impact on the application's bundle size, aligning with the "Performance-First" architectural goal.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Application
- `index.html` — Contains the current inline SVGs and library scripts.
- `services/app.js` — Contains the manual PWA registration logic to be replaced.
- `public/sw.js` — The current custom service worker to be replaced by `vite-plugin-pwa`.
- `vite.config.js` — Needs configuration updates for PWA, hashing, and library optimization.
- `scripts/postbuild.js` — To be removed once `vite-plugin-pwa` is active.

### Research
- `.planning/phases/02-asset-build-modernization/02-RESEARCH.md` — Detailed technical guide for this phase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `index.html` SVGs — The paths and viewboxes are already defined and just need to be moved to the sprite sheet.

### Established Patterns
- **CSS Variable Theming:** The calculator's theme-aware icons rely on CSS variables (e.g., `fill: var(--primary-blue)`). The sprite sheet strategy must preserve this.

### Integration Points
- **Service Worker:** The entry point for PWA registration is currently in `services/app.js`. This will be simplified by `vite-plugin-pwa`'s virtual modules.

</code_context>

<specifics>
## Specific Ideas

- **SVG Naming:** Use descriptive IDs in the sprite sheet (e.g., `icon-plus`, `ui-calc-body`) to make `<use>` references clear.
- **PWA Toast:** The "Prompt for Update" UI should be a non-intrusive but visible notification at the top or bottom of the screen.

</specifics>

<deferred>
## Deferred Ideas

- **Advanced Image Optimization:** Further optimization of non-SVG assets (icons, manifest) is deferred to later polish phases.
- **Offline Calculation Persistence:** Ensuring complex MathLive state is perfectly preserved during updates (beyond simple `localStorage` state) is a Phase 3/4 polish concern.

</deferred>

---

*Phase: 02-asset-build-modernization*
*Context gathered: 2026-03-29*
