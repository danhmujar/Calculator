# Performance Optimization: Vanilla JS Math Calculator

**Project:** Calculator
**Researched:** 2024-03-29
**Overall confidence:** HIGH

This document outlines specific performance optimization techniques for a calculator built with Vanilla JS, Vite, Math.js, and MathLive.

## 1. DOM Manipulation Efficiency

Calculators involve frequent display updates. Inefficient DOM handling can lead to layout thrashing and "jank."

### Key Strategies
- **Batching Updates with `requestAnimationFrame`**: Never update the DOM directly from an event listener. Instead, update an internal state and use `requestAnimationFrame` to sync the DOM with that state.
- **Avoid Layout Thrashing**: Never alternate between reading layout properties (e.g., `offsetWidth`, `getBoundingClientRect`) and writing to the DOM (e.g., `innerHTML`, `style.width`). Perform all reads first, then all writes.
- **Document Fragments**: For complex UI elements like history logs or "tape" views, build the entire subtree in a `DocumentFragment` before appending it to the live DOM.
- **Event Delegation**: Attach a single event listener to the calculator body or button container instead of individual listeners for every button.
- **CSS Isolation**: Use `contain: layout paint;` on the main calculator container to prevent changes inside from triggering reflows of the entire page.

## 2. Math Libraries: Size & Lazy Loading

### Math.js Optimization
Math.js is powerful but heavy (>600KB).
- **Use `mathjs/number`**: If you don't need BigNumber, Complex, or Fraction support, importing from `mathjs/number` reduces size by ~90%.
- **Custom Bundling**: Create a custom instance with only the functions you need:
  ```javascript
  import { create, addDependencies, evaluateDependencies } from 'mathjs'
  const math = create({ addDependencies, evaluateDependencies })
  ```
- **Lazy Loading**: Use dynamic imports `await import('mathjs')` only when the user performs a complex calculation.

### MathLive Optimization
MathLive is a large Web Component (~400KB).
- **Dynamic Registration**: Load MathLive only when the user interacts with a formula-entry field.
  ```javascript
  async function loadMathLive() {
    const { MathfieldElement } = await import('mathlive');
    // Element registers itself
  }
  ```
- **Prevent FOUC**: Use CSS to hide or style the `<math-field>` until it is defined:
  ```css
  math-field:not(:defined) { visibility: hidden; }
  ```
- **Font Preloading**: MathLive requires TeX fonts. Ensure these are either bundled or preloaded to avoid layout shifts when they finally load.

## 3. Memory Management

### State and History
- **Command Pattern for Undo/Redo**: Instead of saving full state snapshots (Memento pattern), store "Commands" (e.g., `AddDigitCommand('5')`). This consumes significantly less memory.
- **Fixed-Size History Stack**: Limit the undo history to a reasonable number (e.g., 50-100 items) using a sliding window (`stack.shift()` when limit reached).
- **Structural Sharing**: When updating complex state, use shallow copies (`{...state, val: 5}`) to share memory for unchanged parts.
- **Cleanup**: Explicitly clear the "Redo" stack when a new action is performed to allow Garbage Collection (GC) of those objects.

## 4. Vite & PWA Build Optimizations

### Vite Configuration
- **Manual Chunking**: Isolate Math.js and MathLive into their own chunks to improve caching.
  ```javascript
  // vite.config.js
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'math-engine': ['mathjs'],
          'math-ui': ['mathlive']
        }
      }
    }
  }
  ```
- **Compression**: Use `vite-plugin-compression` to generate Brotli/Gzip versions of assets.

### PWA (vite-plugin-pwa)
- **Precaching Strategy**: Only precache the "App Shell" (index.html, core JS/CSS, main icons). Do NOT precache the heavy math libraries; let them be cached at runtime after lazy loading.
- **Runtime Caching**: Use a `StaleWhileRevalidate` strategy for fonts and library chunks.
- **Prompt for Update**: Avoid "Auto Update" to prevent losing user state (current calculation) mid-session.

## Sources
- [Math.js Documentation: Custom Bundling](https://mathjs.org/docs/custom_bundling.html)
- [MathLive Documentation: Integration](https://mathlive.io/docs/integration/)
- [Vite PWA Plugin Guide](https://vite-pwa-org.netlify.app/guide/)
- [MDN: Performance and the Rendering Pipeline](https://developer.mozilla.org/en-US/docs/Web/Performance/Fundamentals/Rendering_Performance)
