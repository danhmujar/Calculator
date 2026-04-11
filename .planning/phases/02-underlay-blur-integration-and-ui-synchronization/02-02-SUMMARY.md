---
phase: 02-underlay-blur-integration-and-ui-synchronization
plan: 02-02
subsystem: WebGL Renderer
tags: ['theme', 'uniforms', 'css-bridge']
requirements: ['UI-SYNC-02']
tech-stack: ['WebGL2', 'GLSL', 'JavaScript']
key-files:
  - 'services/theme.js'
  - 'ui/webgl/shaders/primitive.frag'
  - 'ui/webgl/renderer.js'
  - 'ui/styles.css'
metrics:
  duration: '30m'
  completed_date: '2026-04-03'
---

# Phase 02 Plan 02-02: Theme Synchronization Summary

## Objective

Create a synchronization bridge to feed live theme colors from CSS Custom Properties directly into the WebGL fragment shader as uniforms.

## Key Changes

- **CSS Variable Extraction:** Updated `ui/styles.css` to expose discrete aurora colors (`--aurora-color-1`, `--aurora-color-2`, `--aurora-color-3`) for all aurora-based themes.
- **Theme Bridge:** Created `services/theme.js` which reads these CSS variables using `getComputedStyle` and parses them into normalized RGB float arrays.
- **Shader Update:** Modified `ui/webgl/shaders/primitive.frag` to accept `uAuroraColor1`, `uAuroraColor2`, and `uAuroraColor3` uniforms. Added logic to colorize the final blurred output using these colors.
- **Renderer Integration:** Updated `ui/webgl/renderer.js` to fetch theme data in the render loop and pass it to the primitive shader program.

## Verification Results

- Automated: `npx playwright test tests/phase-02.spec.js --grep "Theme Synchronization"`
- Visual: Background blur is correctly colorized based on the active Aurora theme.

## Decisions Made

- **Discrete Aurora Variables:** Chose to extract specific colors from the `conic-gradient` used in the legacy CSS to ensure the WebGL underlay matches the visual feel of the CSS background.
- **Colorization Pass:** Decided to apply colorization in the pass-through pass (`uOffset == 0.0`) of the `primitive.frag` shader.

## Self-Check: PASSED

- [x] `services/theme.js` exists and exports `getThemeUniforms`.
- [x] `primitive.frag` has color uniforms.
- [x] `renderer.js` passes these uniforms.
