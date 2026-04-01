# Phase 9: High-Performance Batching & State Sync - Research

**Researched:** 2026-04-01
**Domain:** WebGL 2.0 / State Management / GPU Performance
**Confidence:** HIGH

## Summary
Phase 9 resolves the performance bottleneck caused by `getBoundingClientRect` in the render loop. The architecture moves to a **State-Sync** approach where layout information is cached in the Store via `ResizeObserver` and synchronized with the GPU using **Uniform Buffer Objects (UBOs)** and **Instanced Attributes**. UI animations (layout shifts/opacity) are offloaded to GPU-side interpolation to maintain 60 FPS under a 100+ row load.

**Primary recommendation:** Use a singleton `ResizeObserver` to sync DOM geometry to the Store, and implement a WebGL 2.0 UBO-backed pipeline for global uniforms.

## Phase Requirements
| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-WGL-05 | Batch Rendering (100+ items) | Instanced rendering with unified shader handles primitives and text in a single call. |
| REQ-WGL-06 | Animation Interpolation | GPU-side interpolation using `mix()` and `u_time` removes CPU overhead. |
| REQ-TEST-02 | WebGL Stress Testing | High-performance batching enables stable 60 FPS for 100+ rows. |

## Standard Stack
- **WebGL 2.0**: Required for UBOs and native instancing support.
- **Uniform Buffer Objects (UBOs)**: Used for sharing global state (time, resolution, scroll) across shaders.
- **ResizeObserver**: Native API for non-blocking geometry tracking.
- **std140 Layout**: Standard memory layout for UBOs in WebGL 2.0.

## Architecture Patterns

### State-Sync Bridge
1. **Layout Tracking**: A `LayoutManager` service uses `ResizeObserver` to monitor elements.
2. **State Storage**: Geometry `{x, y, w, h}` is stored in `store.state.layout`.
3. **Buffer Orphaning**: WebGL instance buffers are updated using `bufferData(..., null, ...)` to avoid GPU stalls.
4. **Scroll Offset**: Applied as a global uniform in the UBO rather than per-instance.

## GPU Animation Strategy
- **Instanced Attributes**: Send `a_startPos`, `a_endPos`, and `a_startTime` per instance.
- **Vertex Interpolation**:
  ```glsl
  float t = clamp((u_time - a_startTime) / u_duration, 0.0, 1.0);
  vec2 pos = mix(a_startPos, a_endPos, ease(t));
  ```

## Don't Hand-Roll
- **Animation Loops**: Don't use `requestAnimationFrame` for per-element interpolation; use the GPU.
- **Layout Math**: Don't use `getBoundingClientRect` in the loop; use `ResizeObserver`.
- **SDF Calculations**: Reuse existing `sdRoundedBox` from `shaders.js`.

## Common Pitfalls
- **UBO Alignment**: `std140` requires 16-byte alignment. Misalignment leads to corrupted uniform data.
- **ResizeObserver Loops**: Prevent Store updates from triggering secondary layout changes that re-trigger the observer.
- **Coordinate Systems**: Ensure Store coordinates (CSS pixels) are correctly converted to WebGL clip space using `u_resolution` and `u_dpr`.

## Code Examples

### GPU Interpolation (Vertex Shader)
```glsl
layout(location = 2) in vec4 a_instRectStart; // [x, y, w, h]
layout(location = 3) in vec4 a_instRectEnd;   // [x, y, w, h]
layout(location = 6) in float a_instStartTime;

uniform float u_time;
uniform float u_duration;

void main() {
    float t = clamp((u_time - a_instStartTime) / u_duration, 0.0, 1.0);
    vec4 rect = mix(a_instRectStart, a_instRectEnd, t * t * (3.0 - 2.0 * t));
    // ... position logic ...
}
```

## Validation Architecture
- **Stress Test**: `tests/performance.spec.js` will simulate 100+ active scientific rows and measure frame drops.
- **State Integrity**: `tests/state.spec.js` will verify Store -> WebGL attribute mapping.

## Sources
- WebGL 2.0 Fundamentals (UBOs/Instancing)
- MDN: ResizeObserver Performance
- MathLive Documentation: Layout and Font Loading
