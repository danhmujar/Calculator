<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** layoutManager integration (Add it to layoutManager observer to handle ResizeObserver shifts)
- **D-02:** recommended (Assume user meant "Overlay Open Class" based on earlier options)
- **D-03:** recommended (Assume user meant "Use ID Selector" based on earlier options)

### the agent's Discretion

None explicitly specified.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

# Phase 5: fixing the about modal and main calculator transparency - Research

**Researched:** 2026-04-05
**Domain:** WebGL UI Rendering, CSS Stacking Contexts, DOM-to-WebGL Synchronization
**Confidence:** HIGH

## Summary

The core issue stems from incomplete synchronization between the DOM state and the WebGL renderer. The "Underlay Blur Pattern" works by having the WebGL canvas render blurred rectangles precisely where DOM panels sit. For the `about-modal`, it was completely omitted from the WebGL renderer's `_drawBlurredStage()`, leaving it without a blur effect after legacy CSS `backdrop-filter` was removed. For the main calculator transparency, a CSS selector mismatch (`.main-calc-display` vs `#main-calc-display`) prevents the transparent background from being applied when WebGL is active, keeping the panel opaque and blocking the blur behind it.

**Primary recommendation:** Register the `about-modal` in the layout manager, conditionally push its bounding rect to the WebGL blur pass only when visible, and fix the CSS selectors targeting `#main-calc-display`.

## Standard Stack

### Core

| Library           | Version | Purpose                          | Why Standard                                                        |
| ----------------- | ------- | -------------------------------- | ------------------------------------------------------------------- |
| Vanilla WebGL 2.0 | Native  | High-performance 2D UI rendering | Avoids the overhead of 3D engines for simple UI overlays.           |
| ResizeObserver    | Native  | DOM-to-WebGL spatial syncing     | Reacts instantly to layout shifts without scroll/resize event jank. |

### Alternatives Considered

| Instead of    | Could Use             | Tradeoff                                                                                                          |
| ------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Vanilla WebGL | Three.js / PixiJS     | 3D libraries add massive bundle weight and abstraction layers unnecessary for 2D quad batching and Kawase blurs.  |
| WebGL Blur    | CSS `backdrop-filter` | CSS `backdrop-filter` introduces severe performance penalties on mobile and M1 hardware when layered extensively. |

## Architecture Patterns

### Recommended Project Structure

```text
ui/
├── uimanager.js     # Manages element registration and DOM tracking
├── styles.css       # Controls opacity state for webgl-active
└── webgl/
    └── renderer.js  # Draws blur quads matching DOM rects
```

### Pattern 1: WebGL Underlay Blur Sync

**What:** The WebGL `<canvas>` sits statically at `z-index: -1`. The DOM elements above it must be completely transparent or semi-transparent. The WebGL renderer reads the DOM element bounding boxes and renders a blurred rectangle at those exact coordinates.
**When to use:** When replacing heavy CSS `backdrop-filter` with a performant WebGL alternative.
**Example:**

```javascript
// Source: ui/webgl/renderer.js
_drawBlurredStage() {
    // ...
    const modal = document.querySelector('.about-modal');
    if (modal && modal.closest('.about-overlay.open')) {
        const rect = layoutManager.getRect(modal);
        if (rect && rect.width > 0 && rect.height > 0) {
            this.pushRect(rect, [...this.themeColors.primary, 0.15], 16, 'about-modal');
        }
    }
}
```

### Anti-Patterns to Avoid

- **Dual-Blurring:** Never leave CSS `backdrop-filter` on an element that is also being blurred by the WebGL underlay. This causes severe rendering stalls.
- **Unconditional Rendering of Hidden Elements:** Pushing bounding boxes for modals/overlays that are currently hidden (`display: none` or `opacity: 0`) creates phantom blurred blocks on the screen.

## Don't Hand-Roll

| Problem          | Don't Build                                 | Use Instead                 | Why                                                                                                                              |
| ---------------- | ------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| UI Blur          | CSS `backdrop-filter`                       | WebGL Kawase Ping-Pong Blur | CSS `backdrop-filter` causes catastrophic frame drops when animated or layered. WebGL provides O(N) separable blurring.          |
| Element Tracking | `window.onresize` + `getBoundingClientRect` | `ResizeObserver`            | Manual tracking misses dynamic layout shifts (like expanding scientific rows) and causes WebGL/DOM desynchronization ("jitter"). |

**Key insight:** Custom ResizeObserver implementations or scroll loop checkers are jittery. The native `ResizeObserver` integrated with `requestAnimationFrame` ensures perfect synchronization.

## Common Pitfalls

### Pitfall 1: CSS Selector Typo Blocking the Blur

**What goes wrong:** The WebGL blur is rendering correctly behind the DOM, but the user cannot see it because the DOM element remains fully opaque.
**Why it happens:** Incorrect CSS selector in the state class toggles. For example, `ui/styles.css` uses `body.webgl-active .main-calc-display` but the HTML element uses `id="main-calc-display"`, causing the fallback solid background to remain active.
**How to avoid:** Ensure precise ID/Class targeting (`#main-calc-display` or `.calc-display`) when overriding backgrounds for `.webgl-active` state.

### Pitfall 2: Modal Visibility Desync

**What goes wrong:** A floating blurred rectangle appears on the screen even when the modal is closed.
**Why it happens:** The WebGL renderer fetches the DOM rect and draws it without verifying if the modal overlay is currently `open` or visible.
**How to avoid:** Always check the parent overlay's `.open` class or computed `opacity`/`visibility` before pushing the rect to the WebGL batch.

## Code Examples

Verified patterns from official sources:

### Fixing the Main Calculator Transparency (CSS)

```css
/* Fix in ui/styles.css */
/* Change .main-calc-display to #main-calc-display */
body.webgl-active #main-calc-display,
body.webgl-active .sci-container {
  background-color: rgba(255, 255, 255, 0.45) !important;
  transition: background-color 0.3s ease;
}

body.webgl-active.dark-theme #main-calc-display,
body.webgl-active.dark-theme .sci-container {
  background-color: rgba(28, 30, 36, 0.45) !important;
}
```

### Syncing the About Modal with WebGL

```javascript
// Register in ui/uimanager.js
const aboutModal = document.querySelector('.about-modal');
if (aboutModal) {
  layoutManager.observe(aboutModal, 'about-modal');
}
```

## State of the Art

| Old Approach          | Current Approach                   | When Changed | Impact                                                                   |
| --------------------- | ---------------------------------- | ------------ | ------------------------------------------------------------------------ |
| CSS `backdrop-filter` | WebGL Kawase Blur                  | Phase 2      | Eliminated GPU stalling on mobile devices.                               |
| Event-driven sync     | `ResizeObserver` + `layoutManager` | Phase 2      | Pixel-perfect sync between WebGL rects and DOM boxes without scroll lag. |

## Open Questions

None. The implementation path is clear.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
| ---------- | ----------- | --------- | ------- | -------- |
| Playwright | UI Testing  | ✓         | 1.58.2  | —        |

## Validation Architecture

### Test Framework

| Property           | Value                                        |
| ------------------ | -------------------------------------------- |
| Framework          | Playwright                                   |
| Config file        | `playwright.config.js`                       |
| Quick run command  | `npx playwright test tests/phase-05.spec.js` |
| Full suite command | `npx playwright test`                        |

### Phase Requirements → Test Map

| Req ID | Behavior                                            | Test Type | Automated Command                            | File Exists? |
| ------ | --------------------------------------------------- | --------- | -------------------------------------------- | ------------ |
| REQ-01 | About modal has WebGL blur sync when visible        | e2e       | `npx playwright test tests/phase-05.spec.js` | ❌ Wave 0    |
| REQ-02 | Main calculator display transparent in webgl-active | e2e       | `npx playwright test tests/phase-05.spec.js` | ❌ Wave 0    |

### Sampling Rate

- **Per task commit:** `npx playwright test tests/phase-05.spec.js`
- **Per wave merge:** `npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/phase-05.spec.js` — covers REQ-01 and REQ-02

## Sources

### Primary (HIGH confidence)

- Local Codebase - `ui/webgl/renderer.js` - identified missing modal injection in `_drawBlurredStage()`.
- Local Codebase - `ui/styles.css` - identified `.main-calc-display` vs `#main-calc-display` typo.
- Local Codebase - `ui/uimanager.js` - identified missing `layoutManager.observe()` for about-modal.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Extracted directly from existing project patterns.
- Architecture: HIGH - WebGL underlay blur pattern is already partially implemented and functional.
- Pitfalls: HIGH - Based directly on the CSS and JS bugs found in the codebase.

**Research date:** 2026-04-05
**Valid until:** 30 days
