# Phase 06 Research: Implement BTS Theme

## Core Findings

### 1. Theming System (`ui/styles.css` & `ui/uimanager.js`)

- Need to introduce a `.theme-bts` class. This class must enforce the "Borahae" purple palette and `dark-theme` colors since Dark Mode is forced.
- Update `UIManager.VALID_THEMES` to include `theme-bts`.
- Update `UIManager`'s `toggleTheme` to retain `.theme-bts` or remove it gracefully, similar to how it handles `theme-aurora`. Same for `setThemeColor`.

### 2. UI Integration

- **Theme Picker:** Add a swatch in `index.html` with `data-theme="theme-bts"`. Use `public/assets/bts logo.png` via a `background-image` CSS rule for this specific button.
- **Equals Button:** The GIF `public/assets/bts-chibi.gif` must replace the "=" symbol when `theme-bts` is active. CSS override `body.theme-bts .calc-btn.eq { background-image: url('./assets/bts-chibi.gif'); color: transparent; background-size: cover; background-position: center; }`.

### 3. WebGL Underlay (`ui/webgl/shaders.js` & `ui/webgl/renderer.js`)

- The current `PRIMITIVE_FRAG` lacks texture support for arbitrary background images. We need to introduce a new uniform `sampler2D uBackgroundTex` and a flag `uIsBTS`.
- For the bubble particles: We can compute bubbles procedurally in the Kawase fragment shader. The procedural approach in `PRIMITIVE_FRAG` is far more efficient than pushing instanced rects. We can add a function to calculate a couple of layers of rising bubbles based on `u_time` and `v_texCoord`.
- Need to load `public/assets/bts_chibi_bg_1775310615594.png` as a WebGLTexture. Add texture loading logic to `WebGLRenderer` and bind it to a new texture unit when `theme-bts` is active.
