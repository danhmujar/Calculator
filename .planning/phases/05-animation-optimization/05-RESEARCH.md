# Phase 05: Animation Optimization - Research

**Researched:** 2026-03-31
**Domain:** UI/UX Performance & Rendering Optimization
**Confidence:** HIGH

## Summary

This research identifies key performance bottlenecks in the current eye-tracking and animation implementation of the Calculator. The primary issues identified are **layout thrashing** caused by `getBoundingClientRect()` calls inside mouse move events and **inefficient style recalculations** due to global CSS variable updates on `document.documentElement`. 

Phase 05 will focus on moving these updates to local element scopes, caching layout boundaries, and auditing all transitions to ensure they remain on the compositor thread (GPU). For the canvas-based font engine, the focus will be on ensuring efficient measurement cycles and potentially offloading to a worker or skipping redundant frames if the display is not changing.

**Primary recommendation:** Cache all layout-dependent coordinates (eye centers, container bounds) on `resize` using `ResizeObserver`, and set CSS variables on the `.calculator-wrapper` instead of `:root` to minimize style recalculation scope.

## User Constraints (from 05-CONTEXT.md)

### Phase Requirements
| ID | Description | Research Support |
|----|-------------|------------------|
| [P5-T1] | CSS-Variable Eye-Tracking Refinement: Optimize pupil logic and transition properties for hardware acceleration. | Use local scoping and layout caching. |
| [P5-T2] | Canvas Rendering Optimization: Profile the display rendering and implement frame-skipping or dirty-rect rendering if needed. | Use frame-skipping for identical updates and OffscreenCanvas if supported. |
| [P5-T3] | Transition Performance: Audit all CSS transitions to ensure they only use `transform` and `opacity`. | Replace `top`, `max-height`, and `gap` animations. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `requestAnimationFrame` | Native | Synchronization | Syncs logic with browser refresh cycle (60fps+). |
| `CSS Variables` | Native | GPU Offloading | Allows JS to drive animations without layout reflows via `transform`. |
| `ResizeObserver` | Native | Layout Caching | Efficiently detects container size changes without polling or expensive `onresize` events. |
| `IntersectionObserver` | Native | Occlusion Culling | Automatically pauses animations when the calculator is scrolled out of view. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| `Chrome DevTools` | Latest | Profiling | Identify layout thrashing (purple bars) and paint flashing (green flashes). |

## Architecture Patterns

### Recommended Project Structure
(No new files required, refactor existing `ui/eye-tracker.js`, `ui/renderer.js`, and `ui/styles.css`).

### Pattern 1: Layout Boundary Caching
**What:** Store coordinates of static or semi-static elements in memory.
**When to use:** Any mouse-following or scroll-following logic.
**Example:**
```javascript
// ui/eye-tracker.js
let cachedEyeBounds = null;

const observer = new ResizeObserver(entries => {
    for (let entry of entries) {
        // Cache bounds once, not on every mousemove
        cachedEyeBounds = entry.target.getBoundingClientRect();
    }
});
observer.observe(document.querySelector('.calculator-wrapper svg'));
```

### Pattern 2: Local CSS Variable Scoping
**What:** Apply `setProperty` to the nearest common ancestor of animated elements.
**When to use:** Updating properties that affect specific UI components.
**Anti-Pattern:** Setting `--mouse-x` on `document.documentElement`.
**Correct Pattern:**
```javascript
const wrapper = document.querySelector('.calculator-wrapper');
wrapper.style.setProperty('--pupil-x', `${tx}px`);
```

### Pattern 3: Compositor-Only Transitions
**What:** Animate ONLY `transform` and `opacity`.
**Why:** These skip the **Layout** and **Paint** stages of the rendering pipeline.
**Example:**
Instead of `transition: max-height 0.3s`, use `transform: scaleY(0)` with `transform-origin: top`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Loop Timing | Custom `setInterval` | `requestAnimationFrame` | Syncs with display refresh; pauses on hidden tabs. |
| Visibility Check | `getBoundingClientRect` polling | `IntersectionObserver` | Offloads visibility logic to the browser; significantly cheaper. |
| Text Fitting | Manual width-looping | `CanvasRenderingContext2D.measureText` | Batched measurement is O(1) compared to O(N) DOM writes/reads. |

## Common Pitfalls

### Pitfall 1: Layout Thrashing in `mousemove`
**What goes wrong:** Calling `rect.left` or `svg.getBoundingClientRect()` inside a mouse event.
**Why it happens:** The browser must stop everything to calculate layout before it can return the value.
**How to avoid:** Cache bounds on resize/scroll.

### Pitfall 2: Global Style Recalculation
**What goes wrong:** Updating variables on `:root`.
**Why it happens:** Every element on the page must check if it inherits the updated variable.
**How to avoid:** Apply variables to the specific container (e.g., the chameleon SVG).

### Pitfall 3: Transitioning "Expensive" Properties
**What goes wrong:** Animating `top`, `left`, `margin`, `padding`, `max-height`.
**Warning signs:** "Green flashes" in DevTools Paint Flashing; "Purple bars" in Performance tab.

## Code Examples

### Optimized Eye Tracking Loop
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
let mouseX = 0, mouseY = 0;
let rafPending = false;
let cachedBounds = null;

// Update bounds only when necessary
const observer = new ResizeObserver(() => {
    cachedBounds = svg.getBoundingClientRect();
});

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(updatePupils);
    }
});

function updatePupils() {
    if (!cachedBounds) return;
    
    // Logic using cachedBounds instead of getBoundingClientRect()
    const dx = mouseX - (cachedBounds.left + cachedBounds.width / 2);
    // ... calculate tx, ty
    
    // Scoped variable update
    svg.style.setProperty('--pupil-x', `${tx}px`);
    rafPending = false;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `setTimeout(16)` | `requestAnimationFrame` | ~2013 | Perfect sync with 60Hz/120Hz displays. |
| `top: Xpx` | `transform: translate()` | ~2015 | Sub-pixel smoothness, GPU acceleration. |
| `onresize` | `ResizeObserver` | ~2020 | Per-element resize tracking, more efficient. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `requestAnimationFrame` | All animations | ✓ | Native | `setTimeout(16)` |
| `ResizeObserver` | Layout caching | ✓ | Native | `window.onresize` |
| `IntersectionObserver` | Perf tuning | ✓ | Native | None (always on) |
| `Canvas API` | Font measurement | ✓ | Native | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright |
| Config file | `playwright.config.js` |
| Quick run command | `npx playwright test tests/performance.spec.js` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| [P5-T1] | Pupil move uses translate3d | smoke | `npx playwright test tests/performance.spec.js` | ✅ |
| [P5-T3] | Transitions only use transform | visual | `npx playwright test tests/performance.spec.js` | ✅ |

## Sources

### Primary (HIGH confidence)
- [MDN Web Docs - CSS performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Animation_performance_and_frame_rate)
- [web.dev - Avoid layout thrashing](https://web.dev/avoid-large-complex-layouts-and-layout-thrashing/)
- [web.dev - GPU acceleration](https://web.dev/stick-to-compositor-only-properties-and-manage-layer-count/)

### Tertiary (LOW confidence)
- "Dirty-rect rendering" necessity (likely overkill for current project scale, but documented for P5-T2).

## Metadata

**Confidence breakdown:**
- Eye-tracking: HIGH (cached bounds + local scope is the industry standard)
- Animation Audit: HIGH (styles.css confirmed to have layout triggers)
- Canvas Opt: MEDIUM (project mostly uses DOM, canvas is only for measurement)

**Research date:** 2026-03-31
**Valid until:** 2026-05-30
