# Phase 10: Full Migration & Final Verification - Research

**Researched:** 2026-04-01
**Domain:** WebGL 2.0 Migration, Visual Regression Testing, Mobile Performance
**Confidence:** HIGH

## Summary

The objective of Phase 10 is to complete the transition from legacy DOM rendering to a 100% Raw WebGL 2.0 rendering layer. This research identifies the safest transition strategies, mobile performance pitfalls, and standard verification patterns for low-level graphics engine migrations.

**Primary recommendation:** Implement a **Virtual Layout Engine** for button/card geometries and transition the WebGL canvas from an "Underlay" to a "Top-Level Overlay," while retaining a **Ghost DOM** (Accessibility Layer) for screen readers and OS keyboard interactions.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pixelmatch` | ^6.0.0 | Visual Regression | Fast, lightweight pixel-level diffing with anti-aliasing detection. |
| `Playwright` | ^1.58.2 | Automated Testing | Industry standard for canvas snapshotting and cross-browser verification. |
| `mathlive` | ^0.109.0 | Math Interaction | Retained in the "Ghost DOM" to handle complex math layout and keyboard triggers. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| `odiff` | ^3.0.0 | Performance Diffing | Use if `pixelmatch` is too slow for large 4K snapshots (rare in this scope). |

**Installation:**
```bash
npm install --save-dev pixelmatch
```

## Architecture Patterns

### Recommended Transition Structure
```
src/
├── ui/
│   ├── webgl/
│   │   ├── events.js        # Centralized event bridge (Canvas -> Virtual UI)
│   │   ├── virtual-layout.js # JS-based geometry calculation (replacing LayoutManager)
│   │   └── accessibility.js  # Ghost DOM management for screen readers
```

### Pattern 1: The "Ghost DOM" (Accessibility Layer)
**What:** Maintain a parallel, invisible DOM structure that mirrors the WebGL state.
**When to use:** Required for 100% accessibility parity and triggering the OS virtual keyboard on mobile.
**Example:**
```javascript
// Render elements with opacity: 0 to keep them in the tree for layout/keyboard triggers
el.style.cssText = `
    position: absolute;
    opacity: 0;
    pointer-events: auto; /* Still receives clicks, but WebGL canvas is on top */
    z-index: 1;
`;
```

### Pattern 2: AABB Hit-Testing (CPU-Side)
**What:** Mapping touch/mouse coordinates to UI elements using mathematical box intersection.
**When to use:** Mandatory for mobile performance to avoid `gl.readPixels()` pipeline stalls.
**Example:**
```javascript
function isPointInBox(px, py, box) {
    return px >= box.x && px <= box.x + box.w && 
           py >= box.y && py <= box.y + box.h;
}
```

### Anti-Patterns to Avoid
- **GPU Color Picking:** Using `gl.readPixels` for hit-testing on mobile causes massive frame drops.
- **Full DOM Removal:** Removing `math-field` from the DOM entirely breaks the `TypographyManager` which relies on the Shadow DOM for layout measurement.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Visual Diffing | Custom loop | `pixelmatch` | Handles anti-aliasing noise and perceptual color shifts. |
| PWA Manifest Audit | Manual check | `Lighthouse` | Detects missing `maskable` icons, theme colors, and offline health. |
| Touch Gestures | Custom logic | Native `PointerEvents` | Handles multi-touch and pressure sensitivity automatically. |

## Common Pitfalls

### Pitfall 1: WebGL Context Loss
**What goes wrong:** The browser drops the WebGL context in the background (especially on iOS).
**Why it happens:** VRAM constraints or system power-saving.
**How to avoid:** Implement `webglcontextlost` and `webglcontextrestored` listeners to re-upload shaders, buffers, and textures.

### Pitfall 2: High-DPI Fill Rate Bottleneck
**What goes wrong:** Rendering at native 3x DPR on high-end mobile devices causes thermal throttling.
**Why it happens:** Fragment shader workload scales with the square of the resolution.
**How to avoid:** Cap `devicePixelRatio` at 2.0 for the rendering buffer while keeping the CSS size at 100vw.

### Pitfall 3: Sub-pixel Blurring
**What goes wrong:** WebGL textures look "fuzzy" compared to the sharp DOM reference.
**Why it happens:** Non-integer coordinates cause bilinear interpolation.
**How to avoid:** Wrap all virtual layout coordinates in `Math.round()` before passing to vertex buffers.

## Code Examples

### WebGL Context Loss Recovery
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Handling_Context_Lost
canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    this.isContextLost = true;
}, false);

canvas.addEventListener('webglcontextrestored', () => {
    this.reinitializeResources(); // Re-upload shaders/textures
    this.isContextLost = false;
    this.render();
}, false);
```

### Centralized Input Handling
```javascript
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Iterate through virtual layout entries in the Store
    const clickedElementId = findElementAt(x, y, store.state.layout);
    if (clickedElementId) {
        dispatchVirtualEvent(clickedElementId, 'click');
    }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| DOM-backed measurement | Virtual Layout Schema | Phase 10 | Decouples rendering from DOM availability. |
| Underlay Pattern (z:-1) | Top-Level Canvas (z:1) | Phase 10 | Allows WebGL to capture events directly. |
| Manual Parity Check | `pixelmatch` Snapshots | 2024+ | Objective verification of 100% visual parity. |

## Open Questions

1. **How to handle "Long Press" for scientific functions?**
   - What we know: Standard `click` doesn't cover complex gestures.
   - What's unclear: Best way to map native `PointerEvents` to virtual long-press without a library.
   - Recommendation: Use a `setTimeout` on `pointerdown` to detect duration.

2. **Impact on SEO/Accessibility?**
   - What we know: Canvas is a black box.
   - What's unclear: If a hidden DOM layer is sufficient for Googlebot.
   - Recommendation: Ensure the "Ghost DOM" uses semantic tags (`button`, `input`) and `aria-label`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| WebGL 2.0 | Core Rendering | ✓ | — | CSS Fallback |
| Playwright | Visual Tests | ✓ | 1.58.2 | Manual Audit |
| Mobile Device | Input Parity | ✓ | Android 14 | Chrome Emulator |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright + pixelmatch |
| Config file | `playwright.config.js` |
| Quick run command | `npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-VER-01 | Side-by-Side Toggle | Visual | `npx playwright test tests/parity.spec.js` | ❌ Wave 0 |
| REQ-VER-02 | Visual Parity Audit | Visual | `npx playwright test tests/parity.spec.js` | ❌ Wave 0 |
| REQ-VER-03 | Touch Verification | E2E | `npx playwright test tests/mobile.spec.js` | ❌ Wave 0 |

## Sources

### Primary (HIGH confidence)
- **WebGL 2.0 Specification** - Best practices for mobile rendering and fill rate.
- **Playwright Documentation** - Patterns for canvas snapshotting and visual diffing.
- **MathLive API** - Handling mathematical layout in a headless environment.

### Secondary (MEDIUM confidence)
- **Wayline.io / Mozilla Hacks** - Mobile WebGL performance pitfalls and thermal throttling.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Industry standards for visual regression.
- Architecture: HIGH - Proven patterns for canvas-based UIs (Figma-style).
- Pitfalls: HIGH - Well-documented mobile WebGL edge cases.

**Research date:** 2026-04-01
**Valid until:** 2026-05-01
