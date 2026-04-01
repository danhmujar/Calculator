# Phase 8: Advanced WebGL Typography & Texturing - Research

**Researched:** 2026-04-01
**Domain:** WebGL 2.0 / SDF Typography / Texture Atlases
**Confidence:** HIGH

## Summary

The primary challenge of Phase 8 is rendering dynamic, high-fidelity mathematical typography in WebGL with perfect parity to MathLive/KaTeX. To achieve this, we will implement a **Dynamic SDF Glyph Atlas** that lazily generates Signed Distance Fields (SDFs) from the browser's Canvas 2D engine. This allows us to leverage existing CSS font-loading and the browser's high-quality text rasterizer while gaining the performance and scaling benefits of GPU-side SDF rendering.

For layout, we will adopt a **DOM-to-WebGL Synchronization Pattern**, where MathLive continues to handle the complex mathematical layout in a hidden Shadow DOM, and the WebGL layer queries the resulting glyph positions and dimensions to reconstruct the visual state in the batch renderer.

**Primary recommendation:** Use **Instanced Rendering** with a single unit quad and a multi-purpose SDF shader that branches between procedural primitives and texture-sampled glyphs. Generate glyphs at runtime using a 100-line "SDF-from-Canvas" utility to ensure 100% font parity with MathLive.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-WGL-04 | Texture Atlas Typography | Identified "SDF-from-Canvas" as the most robust way to sync with MathLive's complex font stacks. |
| REQ-WGL-05 | Batch Rendering | Verified `drawArraysInstanced` as the optimal WebGL 2.0 path for 100+ items. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| WebGL 2.0 | Native | Rendering API | Standard for modern web graphics; required for instancing and VAOs. |
| MathLive | 0.109.0 | Layout Source | The project's existing editor; contains the "source of truth" for math layout. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| TinySDF (Logic) | ~1.0.0 | SDF Generation | A 100-line algorithm to convert Canvas 2D bitmap to SDF. |
| MaxRects (Logic) | Custom | Atlas Packing | Efficiently pack variable-sized glyphs into a square texture. |

**Installation:**
No new npm packages required. The SDF and Packing logic will be implemented as internal utilities to keep the rendering core dependency-free.

## Architecture Patterns

### Recommended Project Structure
```
ui/
└── webgl/
    ├── atlas.js     # Texture atlas management and glyph packing
    ├── typography.js # MathLive/DOM layout extraction and sync logic
    ├── renderer.js  # Updated to support Batching (Instancing)
    └── shaders/
        ├── batch.vert # Instanced vertex shader
        └── batch.frag # Unified SDF (Primitive + Text) fragment shader
```

### Pattern 1: The "Lazy Atlas" Pattern
**What:** Only generate SDFs for characters currently visible or used in the calculator history.
**How:** 
1. When a new character is encountered in a `math-field`, check if it exists in the atlas.
2. If not, draw the character to a small offscreen canvas using the correct KaTeX font.
3. Run the SDF generation algorithm.
4. Pack the new SDF into the master texture atlas.
5. Update the GPU texture via `gl.texSubImage2D`.

### Pattern 2: Shadow DOM Sync
**What:** Use the existing MathLive editor (hidden or visible) to calculate positions.
**Why:** Hand-rolling a LaTeX layout engine is a massive undertaking (10k+ lines).
**Example:**
```javascript
function extractLayout(mathfield) {
    const glyphs = [];
    const root = mathfield.shadowRoot;
    // Walk the DOM tree looking for .ML__label or leaf nodes with text
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while(walker.nextNode()) {
        const node = walker.currentNode;
        const rect = node.parentElement.getBoundingClientRect();
        glyphs.push({
            char: node.textContent,
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            font: getComputedStyle(node.parentElement).font
        });
    }
    return glyphs;
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Math Layout | Custom LaTeX parser | MathLive Shadow DOM | KaTeX layout is extremely complex (kerning, stretching, shifts). |
| Font Parsing | `opentype.js` | Canvas 2D `fillText` | Browser already handles WOFF2/OTF loading and subsetting. |
| Atlas Packing | Full bin-packer | Shelf Packing (Simple) | Glyphs are mostly uniform in height; simple shelf packing is sufficient. |

## Common Pitfalls

### Pitfall 1: Sub-pixel Jitter
**What goes wrong:** Text looks "shaky" or blurry when the calculator scrolls.
**Why it happens:** WebGL coordinates not perfectly aligned with pixel boundaries.
**How to avoid:** Floor the XY coordinates in the vertex shader or ensure the DOM-to-WebGL projection is pixel-perfect.

### Pitfall 2: Atlas Overflow
**What goes wrong:** Adding many different math symbols (Greek, operators, etc.) fills up the 2048x2048 texture.
**Why it happens:** Inefficient packing or lack of an LRU eviction strategy for the atlas.
**How to avoid:** Start with a 1024x1024 atlas (fits ~1000 characters). Implement a simple "clear and rebuild" if the atlas fills up.

### Pitfall 3: Sync Lag
**What goes wrong:** The WebGL text "lags" behind the MathLive cursor.
**How to avoid:** Capture the `math-field` "input" event and update the WebGL layer in the same frame's `requestAnimationFrame`.

## Code Examples

### Unified Batch Fragment Shader (GLSL 3.00 ES)
```glsl
#version 300 es
precision highp float;

uniform sampler2D u_atlas;
in vec2 v_uv;
in float v_type; // 0=Rect, 1=Text
in vec4 v_color;
out vec4 outColor;

float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

void main() {
    float d;
    if (v_type < 0.5) {
        // Procedural Rounded Rect
        d = sdRoundedBox(v_uv - 0.5, vec2(0.5), 0.1);
    } else {
        // Texture-based SDF Text
        float sampled = texture(u_atlas, v_uv).r;
        d = 0.5 - sampled; // 0.5 is the edge in standard SDF
    }
    
    float alpha = smoothstep(fwidth(d), -fwidth(d), d);
    outColor = vec4(v_color.rgb, v_color.a * alpha);
}
```

### Dynamic SDF Generation (Conceptual)
```javascript
// Inspired by Mapbox TinySDF
function generateSDF(char, font) {
    const size = 64; // Base resolution
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    ctx.fillText(char, size/2, size/2);
    
    const imgData = ctx.getImageData(0, 0, size, size);
    // ... Distance transform algorithm (EDT) ...
    return sdfData; // Float32Array or Uint8Array
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Bitmap Fonts | SDF / MSDF | ~2014 | Sharp text at any scale, low memory. |
| Pre-baked Atlases | Dynamic Runtime Atlas | Recent | Support for arbitrary user fonts and Unicode. |
| drawArrays | drawArraysInstanced | WebGL 2.0 (2017) | Massive reduction in draw calls for UI. |

## Open Questions

1. **Should we use MSDF (Multi-channel) instead of SDF?**
   - Recommendation: Start with standard SDF. It is much simpler to implement from scratch in JS. Only move to MSDF (requires a WASM blob like `msdfgen`) if sharp corners on large operators (like `\sum`) look poor.
2. **How to handle "Stretchy" symbols (large brackets)?**
   - These are rendered by KaTeX as multiple `SymbolNode`s (top, extension, bottom). Our DOM-traversal will naturally find these as separate glyphs and position them correctly.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| WebGL 2.0 | Core Rendering | ✓ | Hardware Dependent | — |
| MathLive | Layout Engine | ✓ | 0.109.0 | — |
| OffscreenCanvas | Atlas Generation | ✓ | Chrome 69+ | standard Canvas |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright |
| Config file | `playwright.config.js` |
| Quick run command | `npx playwright test tests/shader.spec.js` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-WGL-04 | Texture Atlas creation | unit | `npx playwright test tests/renderer.spec.js` | ✅ |
| REQ-WGL-05 | Batch rendering calls | integration | `npx playwright test tests/performance.spec.js` | ✅ |

### Wave 0 Gaps
- [ ] `tests/typography.spec.js` — Verify DOM-to-WebGL coordinate translation.
- [ ] `ui/webgl/atlas.js` — Core texture management.

## Sources

### Primary (HIGH confidence)
- [Mapbox TinySDF](https://github.com/mapbox/tiny-sdf) - Fast runtime SDF generation.
- [WebGL 2.0 Instancing](https://webgl2fundamentals.org/webgl/lessons/webgl-instanced-drawing.html) - Official standard patterns.

### Secondary (MEDIUM confidence)
- [KaTeX/MathLive Internals](https://github.com/arnog/mathlive/tree/master/src/core) - Shadow DOM structure.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH
- Architecture: HIGH
- Pitfalls: HIGH

**Research date:** 2026-04-01
**Valid until:** 2026-05-01
