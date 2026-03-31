# Phase 7: WebGL 2.0 Core & Primitive Rendering - Research

**Researched:** 2026-03-31
**Domain:** WebGL 2.0 / 2D UI Rendering
**Confidence:** HIGH

## Summary

This research establishes the foundation for migrating the calculator's rendering layer to Raw WebGL 2.0. The primary recommendation is to adopt the **Global Overlay Pattern**, using a single full-viewport WebGL 2.0 canvas positioned behind the existing DOM UI to render complex backgrounds and decorative elements (primitives). This ensures that interactivity and accessibility remain native (handled by DOM) while performance-intensive rendering is offloaded to the GPU.

For primitive rendering (buttons, cards), **Signed Distance Functions (SDFs)** are the state-of-the-art approach. They provide perfect anti-aliasing, dynamic corner radii, and high-precision effects (borders, shadows) without the memory overhead of texture atlases.

**Primary recommendation:** Use a single global WebGL 2.0 canvas with **SDF-based Rounded Rectangle Shaders** and **Vertex Array Objects (VAOs)** for efficient dynamic buffer management.

## User Constraints (from CONTEXT.md)

*No CONTEXT.md found for Phase 7. Research based on PROJECT.md and REQUIREMENTS.md directives.*

### Project Constraints (from PROJECT.md)
- **Raw WebGL 2.0 Only:** No external rendering libraries (Three.js, PixiJS, etc.).
- **MANDATORY Runnability:** Every phase must end in a "Runnable" state.
- **Visual Parity:** Zero visual changes from the existing DOM-based UI.
- **Verifiability:** Must be manually verifiable via `npm run dev`.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-WGL-01 | WebGL 2.0 Context Initialization | Verified context attributes for high-performance UI (alpha blending vs. opaque). |
| REQ-WGL-02 | GLSL Shader Development | Identified SDF (Signed Distance Function) as SOTA for high-precision primitives. |
| REQ-WGL-03 | Dynamic Vertex Buffers | Established VAO-per-layout and Buffer Orphaning as best practices for UI updates. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| WebGL 2.0 | Native | Primary rendering API | Modern standard for high-performance web graphics with VAO/UBO support. |
| GLSL | 300 es | Shader Language | Required for WebGL 2.0; supports highp precision by default in fragment shaders. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| Vite | ^7.0.0 | Build Tool | Existing project standard for HMR and module loading. |

**Installation:**
No new packages required for raw WebGL 2.0.

## Architecture Patterns

### Recommended Project Structure
```
ui/
├── shaders/         # .glsl shader sources (stored as strings or imported via Vite)
│   ├── primitive.vert
│   └── primitive.frag
├── webgl/
│   ├── context.js   # Context initialization and resize handling
│   ├── renderer.js  # Main WebGL rendering loop and draw call batching
│   └── buffers.js   # VAO and VBO management logic
└── uimanager.js     # Orchestrates DOM and WebGL coordination
```

### Pattern 1: The Global Overlay (Underlay) Pattern
**What:** Use a single `<canvas>` element that covers the entire viewport, positioned behind the DOM content (`z-index: -1`).
**When to use:** When mixing high-performance GPU rendering with standard HTML interactivity and accessibility.
**Example:**
```javascript
// Initialization in UIManager
const canvas = document.createElement('canvas');
canvas.id = 'webgl-rendering-layer';
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.zIndex = '-1';
canvas.style.pointerEvents = 'none'; // Ensure DOM handles all clicks
document.body.appendChild(canvas);
```

### Pattern 2: VAO-per-Layout
**What:** Create a unique **Vertex Array Object (VAO)** for each different vertex layout (e.g., one for UI primitives, one for text glyphs).
**When to use:** Mandated in WebGL 2.0 for performance to avoid expensive state re-specification (`vertexAttribPointer`) during the render loop.

## Dynamic Vertex Buffers

The calculator UI changes frequently (adding rows, toggling modes). To handle this without GPU stalls:

1.  **Buffer Orphaning:** When updating a buffer, call `gl.bufferData(target, size, usage)` with `null` before sending new data. This allows the GPU to finish using the old memory while the CPU writes to a new block.
2.  **Usage Hints:** Use `gl.DYNAMIC_DRAW` for buffers that update frequently (every few frames) or `gl.STREAM_DRAW` if updating every frame.
3.  **Maximum Allocation:** Pre-allocate buffers to the maximum expected size (e.g., 200 rows) to avoid frequent re-allocations that cause jank.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shape Clipping | Manual mask shaders | `gl.scissor` | Native GPU-level viewport clipping is faster and simpler for rectangular regions. |
| Math Constants | Hardcoded PI/e | GLSL built-ins | Better precision and compiler optimization. |
| Layout Engine | WebGL-only layout | DOM-to-WebGL Sync | Use `getBoundingClientRect()` to get positions from DOM, then pass to WebGL. |

## Common Pitfalls

### Pitfall 1: Sync Lag (Jitter)
**What goes wrong:** WebGL elements appear to "lag" behind DOM elements during window resizing or scrolling.
**Why it happens:** DOM layout updates on the compositor thread while WebGL updates on the main thread.
**How to avoid:** Sync all updates within a single `requestAnimationFrame` loop. Avoid CSS transitions on the canvas position; use JS-driven updates.

### Pitfall 2: Layout Thrashing
**What goes wrong:** Frame rate drops significantly when "gluing" WebGL to DOM.
**Why it happens:** Reading `getBoundingClientRect()` then writing to WebGL/DOM styles in a loop forces synchronous layout recalculations.
**How to avoid:** Batch all DOM reads first, then perform all WebGL draw calls/updates.

### Pitfall 3: Resource Leakage
**What goes wrong:** Browser crashes or "Context Lost" errors after multiple calculator mode switches.
**Why it happens:** Failure to `gl.deleteBuffer()`, `gl.deleteVertexArray()`, or `gl.deleteProgram()` when rows or UI components are destroyed.
**How to avoid:** Implement a robust lifecycle management in the WebGL `Renderer` class.

## Code Examples

### WebGL 2.0 Context Initialization
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_2_0
const gl = canvas.getContext('webgl2', {
    alpha: false, // Set to false for opaque background (faster blending)
    antialias: true,
    depth: false, // 2D UI doesn't need depth testing
    stencil: false,
    preserveDrawingBuffer: false
});

if (!gl) {
    throw new Error('WebGL 2.0 not supported');
}
```

### High-Precision SDF Rounded Box Shader (Fragment)
```glsl
#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform vec4 u_color;
uniform vec2 u_rectSize;
uniform float u_radius;

in vec2 v_texCoord; // Range [0, 1]
out vec4 outColor;

// SDF for a rounded rectangle
// p: current point (centered at 0,0), b: half-extents, r: radius
float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

void main() {
    // Map uv [0,1] to pixels and center at 0,0
    vec2 p = (v_texCoord - 0.5) * u_rectSize;
    vec2 b = u_rectSize * 0.5;
    
    float d = sdRoundedBox(p, b, u_radius);
    
    // Anti-aliased alpha mask
    float edge = fwidth(d);
    float alpha = 1.0 - smoothstep(-edge, edge, d);
    
    outColor = vec4(u_color.rgb, u_color.a * alpha);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Texture Atlases for Shapes | SDF (Signed Distance Fields) | ~2015 | Infinite scaling, perfect AA, less VRAM usage. |
| WebGL 1.0 (Extensions) | WebGL 2.0 (Core) | 2017 (Standard) | Native VAOs, UBOs, and Transform Feedback. |
| Per-button Draw Calls | Instanced Rendering | WebGL 2.0 Core | Minimize CPU-GPU overhead for 100+ identical items. |

## Open Questions

1. **How to handle MathLive font rendering in Phase 7?**
   - Recommendation: Continue using DOM for text in Phase 7. Text migration to WebGL (Texture Atlas) is scheduled for Phase 8 (REQ-WGL-04).
2. **Will `vite-plugin-glsl` be used?**
   - Recommendation: Keep it raw. Use template literals in JS or a simple `fetch()` for `.glsl` files to maintain the "Zero Dependencies" ethos of the core rendering layer.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| WebGL 2.0 | Core Rendering | ✓ | Hardware Dependent | Canvas 2D (Performance impact) |
| Node.js | Development/Vite | ✓ | v24.13.0 | — |
| npm | Dependency Management | ✓ | 11.10.0 | — |
| mathjs | Scientific Logic | ✓ | 15.1.1 | — |
| mathlive | WYSIWYG Input | ✓ | 0.109.0 | — |

**Missing dependencies with no fallback:**
- None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright |
| Config file | `playwright.config.js` |
| Quick run command | `npx playwright test tests/state.spec.js` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-WGL-01 | Canvas initialization | unit | `npx playwright test tests/renderer.spec.js` | ❌ Wave 0 |
| REQ-WGL-02 | Shader compilation | integration | `npx playwright test tests/integration.spec.js` | ✅ existing |
| REQ-WGL-03 | Buffer updates | performance | `npx playwright test tests/performance.spec.js` | ✅ existing |

### Wave 0 Gaps
- [ ] `tests/renderer.spec.js` — covers REQ-WGL-01 (WebGL context verification)
- [ ] `ui/webgl/` directory initialization

## Sources

### Primary (HIGH confidence)
- MDN WebGL 2.0 Reference - [Context and VAO initialization](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_2_0)
- Inigo Quilez - [2D Distance Functions (SDFs)](https://iquilezles.org/articles/distfunctions2d/)
- WebGL Fundamentals - [Dynamic Buffers and Batching](https://webgl2fundamentals.org/webgl/lessons/webgl-render-to-texture.html)

### Secondary (MEDIUM confidence)
- Blog: [Performance Pitfalls of Mixing DOM and WebGL](https://webperf.tips/)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - WebGL 2.0 is a stable standard.
- Architecture: HIGH - Overlay pattern is industry standard for hybrid UIs.
- Pitfalls: HIGH - Common issues are well-documented in game development communities.

**Research date:** 2026-03-31
**Valid until:** 2026-04-30
