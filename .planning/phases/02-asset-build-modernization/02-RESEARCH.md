# Research: Asset & Build Modernization (Phase 2)

**Phase:** 2
**Date:** 2026-03-29
**Overall confidence:** HIGH

## Overview
Phase 2 focuses on transitioning from a "hacky" CDN-based and manual PWA setup to a modern, automated, and optimized build pipeline using Vite and npm-managed dependencies. This reduces initial load times, improves offline reliability, and simplifies maintenance.

## Standard Stack

| Category | Tool/Library | Version | Purpose |
|----------|--------------|---------|---------|
| Build Tool | Vite | 8.x | Modern ESM bundler with fast HMR. |
| PWA Manager | `vite-plugin-pwa` | 0.21+ | Zero-config PWA with service worker generation. |
| Math Engine | `mathjs` | 14.x | Precise calculation engine. |
| Math UI | `mathlive` | 0.101+ | LaTeX-based formula editor. |

## Architecture Patterns

### 1. Externalizing SVGs
**Avoid:** Inlining 50+ SVGs in `index.html`.
**Pattern:** Use a single SVG sprite sheet (`public/assets/sprites.svg`) or individual files loaded via `<use xlink:href="...">`.
**Vite way:** Use `vite-plugin-svg-icons` or simply reference external files from `public/`.

### 2. Dependency Overhaul (npm vs. CDN)
**Avoid:** `<script src="https://unpkg.com/mathjs">`.
**Pattern:** `import { create, all } from 'mathjs'`.
**Benefit:** Tree-shaking. By importing only what's needed (e.g., `mathjs/number`), we reduce bundle size from ~600KB to ~60KB.

### 3. PWA Modernization
**Avoid:** Manual `sw.js` and `scripts/postbuild.js`.
**Pattern:** Use `vite-plugin-pwa` with `workbox` strategies.
**Config:** Enable `registerType: 'autoUpdate'` for seamless background updates while preserving session state if possible.

## Don't Hand-Roll

- **Service Workers:** Never write `sw.js` by hand. `vite-plugin-pwa` handles edge cases (caching, offline, updates) more reliably.
- **Asset Hashing:** Do not disable hashing in `vite.config.js`. Vite's native hashing is essential for cache-busting.
- **SVG Management:** Do not manually concatenate SVGs. Use a script or plugin if possible, or keep them as clean individual files in `public/`.

## Common Pitfalls

- **MathLive FOUC:** When lazy-loading `mathlive`, the `<math-field>` element may appear as a raw text input for a split second. 
    - *Fix:* Use `math-field:not(:defined) { visibility: hidden; }`.
- **MathLive Fonts:** MathLive expects TeX fonts. 
    - *Fix:* Ensure `mathlive/dist/fonts` is included in the build or preloaded.
- **PWA Update Loops:** Incorrectly configured service workers can cause infinite refresh loops.
    - *Fix:* Use `vite-plugin-pwa` defaults.
- **Mathjs Bundle Size:** Importing `all` from `mathjs` is huge.
    - *Fix:* Create a custom instance or use `mathjs/number`.

## Code Examples

### 1. `vite.config.js` (Modern PWA + Hashing)
```javascript
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/Calculator/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Efficient Calculator',
        short_name: 'Calc',
        description: 'High-performance offline calculator',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
  build: {
    // Re-enable hashing
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    }
  }
});
```

### 2. Tree-Shaken Math.js
```javascript
// services/math-engine.js
import { create, addDependencies, evaluateDependencies, numberDependencies } from 'mathjs';

// Create a custom instance with only what we need
const math = create({
  addDependencies,
  evaluateDependencies,
  ...numberDependencies
});

export default math;
```

### 3. SVG Sprite usage
```html
<svg class="icon">
  <use xlink:href="/Calculator/assets/sprites.svg#icon-settings"></use>
</svg>
```

## Gaps to Address
- **SVG Sprite Creation:** Need to decide whether to use a Vite plugin or a one-time script to generate `sprites.svg` from the 50+ inline SVGs in `index.html`.
- **MathLive Web Component:** Confirm if the `mathlive` npm package exports the Web Component registration automatically or if `MathfieldElement` needs explicit registration.
