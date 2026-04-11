# Phase 2: Underlay Blur Integration and UI Synchronization - Research

**Researched:** 2024-07-29
**Domain:** WebGL Rendering & DOM Interop
**Confidence:** HIGH

## Summary

This research phase confirms the technical approach for replacing the legacy CSS `backdrop-filter` with a high-performance, vanilla WebGL 2.0 implementation. The core of the approach is a **4-pass Kawase Blur**, which provides a visually appealing and computationally efficient frosted-glass effect.

The architecture will use two Framebuffer Objects (FBOs) in a "ping-pong" configuration to iteratively apply the blur. Visual state, such as theme colors defined in CSS, will be synchronized with the WebGL shader via a dedicated `theme-bridge` module. This module will read CSS Custom Properties at runtime and pass them to the shader as uniforms, ensuring the WebGL rendering perfectly matches the application's theme. Resizing will be handled robustly by a `ResizeObserver`, which will trigger the recreation of FBOs to match the new canvas dimensions.

**Primary recommendation:** Implement the 4-pass Kawase blur using the FBO ping-pong pattern for the blur effect, and use a `theme-bridge` to sync CSS variables to shader uniforms for the aurora gradient effect.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-03 (Algorithm):** The renderer **MUST** implement a **Kawase Blur** for the multi-pass blur effect. This is a performance-focused choice to ensure a smooth user experience.
- **D-04 (Implementation):** The blur effect **MUST** be implemented using a 4-pass approach, "ping-ponging" between two dedicated Frame Buffer Objects (FBOs) to generate the final result.
- **D-05 (Source of Truth):** The "Aurora" theme's defining values (colors, gradients, etc.) **MUST** remain as CSS Custom Properties in the stylesheet to serve as the single source of truth.
- **D-06 (Synchronization):** A dedicated "theme bridge" module **MUST** be created. It is responsible for reading the CSS Custom Properties at runtime via `getComputedStyle()` and passing them to the WebGL fragment shader as `uniforms`. This ensures the WebGL rendering stays in sync with the CSS definitions.
- **D-07 (Resize Logic):** The main WebGL renderer module **MUST** own the `ResizeObserver` callback. When a resize is detected, it must perform the following actions in order: 1) Update the canvas element's dimensions, 2) Call `gl.viewport()`, and 3) Recreate the FBOs used for the blur effect at the new dimensions.

### the agent's Discretion

- The precise implementation of the `theme-bridge` module.
- The specific code structure within the fragment shader for handling the blur passes and applying the theme uniforms.
- How the `ResizeObserver` is initialized and attached to the correct DOM element.
  </user_constraints>

## Standard Stack

No new external libraries are required. The implementation will rely exclusively on:

| Technology | Version | Purpose                | Why Standard       |
| ---------- | ------- | ---------------------- | ------------------ |
| JavaScript | ES6+    | Core application logic | Browser native     |
| WebGL 2.0  | 2.0     | Rendering pipeline     | Project constraint |
| GLSL       | 300 es  | Shading language       | WebGL 2.0 standard |

## Architecture Patterns

### Pattern 1: Multi-Pass Blur via FBO Ping-Pong

**What:** An iterative rendering technique to apply post-processing effects. Two FBOs (`FBO_A`, `FBO_B`) are used. The output of one pass becomes the input for the next, swapping roles until the final pass, which renders to the screen. This avoids reading from and writing to the same texture in a single pass.

**When to use:** For any multi-pass shader effect, including the required 4-pass Kawase blur.

**Example Flow (4-pass):**

1.  **Pass 1:** Bind `FBO_A` as target. Draw fullscreen quad using **Original Scene Texture** as input. Use blur shader with `uOffset = 0.0`.
2.  **Pass 2:** Bind `FBO_B` as target. Draw fullscreen quad using **Texture from `FBO_A`** as input. Use blur shader with `uOffset = 1.0`.
3.  **Pass 3:** Bind `FBO_A` as target. Draw fullscreen quad using **Texture from `FBO_B`** as input. Use blur shader with `uOffset = 2.0`.
4.  **Pass 4:** Bind canvas framebuffer (target is screen). Draw fullscreen quad using **Texture from `FBO_A`** as input. Use blur shader with `uOffset = 3.0`.

### Pattern 2: CSS Theme Bridge

**What:** A JavaScript module that reads CSS Custom Properties from the DOM and passes them to a WebGL shader as uniforms. This keeps the visual source of truth in CSS while allowing WebGL to match it perfectly.

**When to use:** When WebGL shaders need to use dynamic theme values (colors, sizes, etc.) defined in CSS.

**Example:**

```javascript
// In the theme-bridge.js module
function syncTheme(gl, program) {
  const styles = getComputedStyle(document.documentElement);

  const color1 = styles.getPropertyValue('--aurora-color-1').trim();
  const color2 = styles.getPropertyValue('--aurora-color-2').trim();

  // Convert color string (e.g., "#RRGGBB") to a vec3/vec4 array
  const color1Vec = parseColor(color1);

  gl.useProgram(program);
  const color1Location = gl.getUniformLocation(program, 'uColor1');
  gl.uniform3fv(color1Location, color1Vec);
  // ... and so on for other uniforms
}
```

## Don't Hand-Roll

| Problem           | Don't Build                                 | Use Instead                           | Why                                                                                                                                                                           |
| ----------------- | ------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Blur effect       | A custom, single-pass, or naive blur shader | A standard multi-pass **Kawase Blur** | Kawase blur is a well-known, highly optimized algorithm that provides a high-quality, near-Gaussian blur with excellent performance by leveraging hardware texture filtering. |
| DOM Style Reading | Manual CSS file parsing or `element.style`  | `getComputedStyle()` API              | `getComputedStyle()` correctly resolves the final, applied style for an element from all sources (stylesheets, inline styles), including CSS Custom Properties.               |

## Common Pitfalls

### Pitfall 1: Incorrect FBO Texture Filtering

**What goes wrong:** The blur has sharp, blocky artifacts instead of a smooth gradient.
**Why it happens:** The textures attached to the FBOs are created with the default `gl.NEAREST` filtering. The Kawase blur algorithm relies on `gl.LINEAR` to average texels between pixels.
**How to avoid:** Explicitly set `gl.TEX_MIN_FILTER` and `gl.TEX_MAG_FILTER` to `gl.LINEAR` when creating the FBO textures.

### Pitfall 2: Forgetting to Trim CSS Property Values

**What goes wrong:** Color values passed to the shader are invalid, causing black or incorrect colors in the render.
**Why it happens:** `getPropertyValue()` often returns values with leading/trailing whitespace (e.g., `" #ff0000"`).
**How to avoid:** Always call `.trim()` on the string returned from `getPropertyValue()` before parsing it.

### Pitfall 3: Inefficient Blur Resolution

**What goes wrong:** The application runs slowly, especially on larger screens or lower-end GPUs, despite using a performant shader.
**Why it happens:** The blur is calculated at full resolution.
**How to avoid:** Create the FBOs at a lower resolution than the canvas (e.g., `canvas.width / 4`). This significantly reduces the number of fragments the GPU needs to process for the blur effect, with a minimal impact on visual quality.

## Code Examples

### Kawase Blur Fragment Shader (GLSL)

```glsl
// Source: Community best practices
precision mediump float;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uOffset; // Iteration of the blur pass (0.0, 1.0, 2.0, ...)

varying vec2 vUv;

void main() {
    vec2 pixelSize = 1.0 / uResolution;

    // The +0.5 offset leverages linear filtering to sample 4 texels with one lookup
    vec4 color = texture2D(uTexture, vUv + (vec2(uOffset, uOffset) + 0.5) * pixelSize);
    color += texture2D(uTexture, vUv + (vec2(-uOffset, uOffset) + 0.5) * pixelSize);
    color += texture2D(uTexture, vUv + (vec2(-uOffset, -uOffset) + 0.5) * pixelSize);
    color += texture2D(uTexture, vUv + (vec2(uOffset, -uOffset) + 0.5) * pixelSize);

    gl_FragColor = color * 0.25;
}
```

### Pass-Through Vertex Shader (GLSL)

```glsl
// Source: Standard WebGL boilerplate
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
    // Map quad coordinates from [-1, 1] to UVs [0, 1]
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
```

### Theme Bridge Example (JavaScript)

```javascript
// Source: MDN Documentation for getComputedStyle
const rootStyles = getComputedStyle(document.documentElement);

function getThemeColor(variableName) {
  const colorStr = rootStyles.getPropertyValue(variableName).trim();
  if (!colorStr.startsWith('#')) return [0, 0, 0]; // Or some default

  const r = parseInt(colorStr.substring(1, 3), 16) / 255.0;
  const g = parseInt(colorStr.substring(3, 5), 16) / 255.0;
  const b = parseInt(colorStr.substring(5, 7), 16) / 255.0;
  return [r, g, b];
}

// Usage in render loop
const uAurora1 = gl.getUniformLocation(program, 'uAuroraColor1');
gl.uniform3fv(uAurora1, getThemeColor('--aurora-color-1'));
```

## Sources

### Primary (HIGH confidence)

- **`02-CONTEXT.md`**: Provided locked decisions on Kawase blur, 4-pass implementation, FBO ping-pong, and the theme-bridge architecture.
- **`REQUIREMENTS.md`**: Provided constraints on using vanilla WebGL 2.0.

### Secondary (MEDIUM confidence)

- **Web Search (`javascript getComputedStyle get css custom property`)**: Provided the canonical method for reading CSS variables, which is central to the `theme-bridge` pattern.
- **Web Search (`webgl kawase blur shader`)**: Provided a standard, performant GLSL implementation of the Kawase blur fragment shader, confirming the algorithm's structure.
- **General WebGL Knowledge**: The FBO ping-pong pattern is a standard technique for multi-pass effects, and its structure is well-understood even though direct code searches failed. The description is based on this established knowledge.
