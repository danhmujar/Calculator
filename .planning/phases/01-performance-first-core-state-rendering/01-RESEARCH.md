# Phase 1: Performance-First Core (State & Rendering) - Research

**Researched:** 2026-03-29
**Domain:** JavaScript State Management & Rendering Optimization
**Confidence:** HIGH

## Summary

Phase 1 focuses on refactoring the foundation of the calculator to improve performance and maintainability. The current implementation suffers from layout thrashing in font sizing logic and inefficient state persistence through DOM scraping. 

The research recommends a decoupled architecture using a centralized, reactive `Store` for state management and a batch-rendering pattern using `requestAnimationFrame`. For font sizing, the standard approach to eliminate layout thrashing is using the `CanvasRenderingContext2D.measureText()` API to calculate font size in memory before applying it to the DOM.

**Primary recommendation:** Implement a simple PubSub `Store` for state and use an off-screen Canvas for O(1) font size calculations.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-P1 | Eliminate Layout Thrashing in `fitDisplayText` | Use `Canvas.measureText()` to calculate font size without read-write loops. |
| REQ-P2 | Source-of-Truth State Management | Implement a centralized `Store` object; `saveState` becomes a subscriber. |
| REQ-P3 | Efficient DOM Updates | Implement `requestAnimationFrame` (rAF) to batch UI updates. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JS | ES6+ | Core logic | Maximum performance, zero overhead for a PWA. |
| Canvas API | — | Text measurement | Built-in, extremely fast, avoids layout thrashing. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| math.js | 11.8.0 | Math engine | Used for high-precision arithmetic and scientific mode. |
| mathlive | 0.108.3 | SCI input | Used for WYSIWYG LaTeX formula input in scientific mode. |

**Installation:**
```bash
# Phase 1 uses existing libraries (currently via CDN). 
# Migration to npm is scheduled for Phase 2.
```

## Architecture Patterns

### Recommended Project Structure
```
services/
├── app.js           # Orchestrator & Logic
├── store.js         # Centralized State (New)
└── renderer.js      # DOM Update Batching (New)
```

### Pattern 1: PubSub State Store
**What:** A simple class that holds state and notifies subscribers of changes.
**When to use:** To replace DOM-scraping for state persistence and to enable decoupled UI updates.
**Example:**
```javascript
// Source: https://css-tricks.com/build-a-state-management-system-with-vanilla-javascript/
class Store {
    constructor(initialState) {
        this.state = initialState;
        this.subscribers = [];
    }
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }
    subscribe(callback) {
        this.subscribers.push(callback);
    }
    notify() {
        this.subscribers.forEach(s => s(this.state));
    }
}
```

### Pattern 2: rAF Rendering Loop
**What:** Scheduling DOM updates using `requestAnimationFrame`.
**When to use:** To batch multiple state changes into a single frame's render.
**Example:**
```javascript
let frameRequested = false;
function scheduleRender() {
    if (frameRequested) return;
    frameRequested = true;
    requestAnimationFrame(() => {
        updateUI();
        frameRequested = false;
    });
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Expression Parsing | Custom regex parser | `math.js` | Edge cases in PEMDAS and scientific notation are complex. |
| Math Input | Input with MathML/LaTeX | `mathlive` | Accessibility and mobile-friendly math editing is a massive project. |
| Precision | Float arithmetic | `BigNumber` (math.js) | Avoids `0.1 + 0.2 !== 0.3` errors. |

## Common Pitfalls

### Pitfall 1: Layout Thrashing
**What goes wrong:** Calling `scrollWidth` or `offsetWidth` immediately after setting `fontSize`.
**Why it happens:** The browser must perform a layout calculation to answer the width query.
**How to avoid:** Measure text using `canvas.measureText()` or pre-calculate widths.

### Pitfall 2: Stale Closures in Subscribers
**What goes wrong:** Subscribers holding onto old state or DOM references.
**How to avoid:** Ensure subscribers are passed the latest state and use weak references where applicable (though less critical in this simple app).

## Code Examples

### Optimized `fitDisplayText` with Canvas
```javascript
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

function fitDisplayText(text, containerWidth, maxRem, minRem) {
    // 1. Measure at reference size (e.g. 100px)
    ctx.font = `100px "Plus Jakarta Sans"`;
    const measuredWidth = ctx.measureText(text).width;
    
    // 2. Calculate needed font size
    const baseSize = 16; // 1rem = 16px
    const targetWidthPx = containerWidth;
    let idealSizePx = (targetWidthPx / measuredWidth) * 100;
    
    // 3. Clamp and convert to rem
    let idealRem = idealSizePx / baseSize;
    let finalRem = Math.min(maxRem, Math.max(minRem, idealRem));
    
    return finalRem;
}
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| DOM Scraping | Centralized Store | Better reliability, easier debugging. |
| While-loop layout checks | `measureText()` scaling | Zero layout thrashing, 60fps display updates. |
| Immediate DOM writes | `rAF` batching | Reduced CPU usage, smoother animations. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Canvas API | `fitDisplayText` | ✓ | — | While-loop (current) |
| LocalStorage | `saveState` | ✓ | — | Memory-only |
| math.js | SCI Mode | ✓ | 11.8.0 | Standard mode only |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright |
| Config file | `playwright.config.js` |
| Quick run command | `npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-P1 | Font size scales to fit container | E2E | `npx playwright test tests/display.spec.js` | ❌ Wave 0 |
| REQ-P2 | State persists through reload | E2E | `npx playwright test tests/state.spec.js` | ❌ Wave 0 |
| REQ-P3 | No layout thrashing detected | Perf | Lighthouse audit (manual/CI) | ✅ |

### Wave 0 Gaps
- [ ] `tests/state.spec.js` — covers REQ-P2
- [ ] `tests/display.spec.js` — covers REQ-P1

## Sources

### Primary (HIGH confidence)
- MDN Web Docs: `CanvasRenderingContext2D.measureText()`
- MDN Web Docs: `requestAnimationFrame()`
- Web.dev: "Avoid layout thrashing"

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Standard browser APIs.
- Architecture: HIGH - Proven patterns for Vanilla JS apps.
- Pitfalls: HIGH - Well-documented performance issues.

**Research date:** 2026-03-29
**Valid until:** 2026-04-28
