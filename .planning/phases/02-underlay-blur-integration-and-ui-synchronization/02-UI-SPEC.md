# Phase 2: Underlay Blur Integration and UI Synchronization - UI Design Contract

## 1. Design Tokens

### Spacing

The following 4-point scale must be maintained for all WebGL-rendered UI elements (rounding, padding, offsets):

- **Scale:** 4, 8, 16, 24, 32, 48, 64
- **Corner Radius:**
  - `8px`: Standard cards (`.calc-card`, `.math-row`).
  - `16px`: Buttons (`.btn`, `.calc-btn`) and Main display (`#main-calc-display`).

### Typography

The WebGL SDF (Signed Distance Field) typography engine must support:

- **Primary Font:** `Plus Jakarta Sans` (Matches DOM)
- **Fallback Font:** `Inter`, `sans-serif`
- **Sizes:**
  - `14px`: Small labels / metadata.
  - `18px`: Base UI text.
  - `24px`: Large display digits.
  - `48px`: Decorative symbols (Σ, π, ƒ).
- **Weights:** Regular (400), Bold (700).
- **Line Height:** 1.5 (Standard body), 1.2 (Headings/Display).

### Color (Theme Bridge Contract)

The `theme-bridge` module will synchronize the following CSS Custom Properties to WebGL uniforms.
**Note:** New specific color variables are introduced to support decomposition of `conic-gradient` into shader-ready uniforms.

| CSS Variable       | Role                                        | Target Uniform      | 60/30/10 Split   |
| ------------------ | ------------------------------------------- | ------------------- | ---------------- |
| `--bg-color`       | Dominant surface                            | `uBgColor`          | 60% (Base)       |
| `--panel-bg`       | Secondary (Glass)                           | `uPanelBg`          | 30% (Cards)      |
| `--primary-blue`   | Accent Color (Active buttons, Primary CTAs) | `uAccentColor`      | 10% (Highlights) |
| `--error-red`      | Destructive Color (Clear/Delete actions)    | `uDestructiveColor` | N/A (State)      |
| `--aurora-color-1` | Aurora Stop 1                               | `uAuroraColors[0]`  | N/A (Gradient)   |
| `--aurora-color-2` | Aurora Stop 2                               | `uAuroraColors[1]`  | N/A (Gradient)   |
| `--aurora-color-3` | Aurora Stop 3                               | `uAuroraColors[2]`  | N/A (Gradient)   |
| `--aurora-color-4` | Aurora Stop 4                               | `uAuroraColors[3]`  | N/A (Gradient)   |

## 2. Visual Contract: Kawase Blur

To achieve 100% visual parity with legacy `backdrop-filter: blur(12px)`, the WebGL renderer must implement:

- **Algorithm:** 4-pass Kawase Blur.
- **Focal Point:** The primary calculator display area remains the visual focal point, where high-contrast sharp text must be rendered over the blurred background.
- **Implementation:** Ping-pong between two Framebuffer Objects (FBOs).
- **Optimization:** FBOs must be downscaled to **1/4 (0.25x)** of the canvas resolution.
- **Filtering:** `gl.LINEAR` must be used for FBO textures to ensure smooth gradients (Avoiding Pitfall 1).
- **Result:** The blurred texture is rendered _only_ behind DOM elements tracked by `layoutManager`.

## 3. Interaction Contract: Synchronization & Resizing

### Resizing Logic

- **Owner:** `WebGLRenderer` (via a dedicated `ResizeObserver`).
- **Priority:** Must trigger _before_ the next animation frame after a DOM resize.
- **Sequence:**
  1. Update `<canvas>` CSS and internal dimensions (respecting `devicePixelRatio`).
  2. Update `gl.viewport()`.
  3. Re-allocate FBOs at the new downscaled resolution.
- **Scientific Toggle:** The expansion of the scientific panel must trigger a full shader resize pass to prevent texture stretching or z-index flickering.

### Theme Bridge

- **Source:** `getComputedStyle(document.documentElement)`.
- **Parsing:** Must call `.trim()` on all retrieved property values before hex-to-float conversion (Avoiding Pitfall 2).
- **Reactive:** Sync must occur whenever `document.body.classList` changes (e.g., `dark-theme` toggle, theme switch).

## 4. Copywriting Contract

| Element              | Copy                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| **Fallback Message** | "WebGL Initialization Failed. Falling back to CSS." (Console Warning) |
| **Empty State**      | N/A (Handled by DOM)                                                  |
| **Error State**      | "Renderer Error: Lost Context" (Console Error)                        |

## 5. Implementation Guardrails

### Accessibility (A11y)

- **A11y-01:** The WebGL canvas must remain `aria-hidden="true"`.
- **A11y-02:** No interactive elements should be rendered _solely_ in WebGL without a DOM backing for screen readers.

### Stacking & Events

- **Stack-01:** Maintain sibling hierarchy: `<canvas>` and `<main>` must be direct siblings inside the body.
- **Pointer-01:** Canvas MUST have `pointer-events: none` to allow clicks to reach the DOM.

### Performance

- **Perf-01:** Avoid re-reading CSS variables every frame. Only sync on theme change or mode toggle.
- **Perf-02:** Use UBOs (Uniform Buffer Objects) for global state (Resolution, Time, DPR) as per existing architecture.

## 6. Component Registry

| Component         | Path                   | Status  |
| ----------------- | ---------------------- | ------- |
| `theme-bridge`    | `services/theme.js`    | Planned |
| `blur-fbo-system` | `ui/webgl/renderer.js` | Planned |
