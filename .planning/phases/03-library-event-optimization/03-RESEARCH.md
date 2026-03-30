<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- No specific Phase 03 decisions locked in CONTEXT.md.

### the agent's Discretion
- Implementation of `mathjs/number` lightweight build.
- Strategy for `MathLive` lazy-loading.
- Event delegation refactoring approach.
- CSS Variable eye-tracking logic.

### Deferred Ideas (OUT OF SCOPE)
- Transitioning to a full framework (React/Vue).
- Redesigning the calculator's visual identity.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-B4 | Library Optimization: mathjs/number and MathLive lazy-loading | Research confirms ~70% size reduction with `mathjs/number` and dynamic `import()` for `MathLive`. |
| REQ-P4 | Eye-Tracking Optimization: Offload to CSS variables | Research confirms `requestAnimationFrame` + `transform` (GPU) as the 2025 performance standard. |
| REQ-P3 | Efficient DOM Updates: Batching with rAF | Integration of rAF into the rendering pipeline avoids layout thrashing. |
| REQ-M1 | Architectural Clean-up: Separation of layers | Event delegation refactoring supports better layer separation (UI vs Logic). |
</phase_requirements>

# Phase 03: Library & Event Optimization - Research

**Researched:** 2026-03-30
**Domain:** Library Bundle Optimization & Event Performance
**Confidence:** HIGH

## Summary

This phase focuses on optimizing the footprint and runtime performance of the calculator's third-party dependencies and interactive features. Key areas include migrating to a lightweight `mathjs` build, implementing lazy-loading for the heavy `MathLive` editor, and refactoring the "Chameleon" eye-tracking to use GPU-accelerated CSS variables. Additionally, the event delegation strategy will be refined to ensure minimal impact on **Interaction to Next Paint (INP)** by moving listeners closer to their targets and handling nested elements correctly.

**Primary recommendation:** Use the `mathjs/number` entry point for a ~70% bundle size reduction and lazy-load `MathLive` using dynamic `import()` only when the scientific mode is activated.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `mathjs` | 15.1.1 | Expression parsing & evaluation | Industry standard for robust math parsing; supports `mathjs/number` for lightweight builds. |
| `mathlive` | 0.109.0 | Interactive Math Input | SOTA for interactive TeX-based mathfields. Supports lazy-loading and dynamic imports. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vite-plugin-pwa` | 1.2.0 | PWA / Service Worker | Standard for modern PWA management in Vite projects. |
| `Native CSS Variables` | N/A | High-performance styling | Preferred for mouse-tracking and eye-tracking to offload work to the GPU. |

## Architecture Patterns

### Recommended Project Structure
```
src/
├── services/
│   ├── app.js         # Core state and logic
│   └── math-engine.js # Lightweight mathjs wrapper (using mathjs/number)
├── ui/
│   ├── renderer.js    # Batching DOM updates (rAF)
│   ├── eye-tracker.js # CSS variable-based tracking
│   └── ui.js          # Event delegation and view logic
```

### Pattern 1: Lightweight Math Engine
**What:** Use the `mathjs/number` subpath to exclude heavy types like BigNumber, Complex, and Matrices.
**When to use:** When high-precision (arbitrary) decimals or complex numbers are not required.
**Example:**
```javascript
// Source: https://mathjs.org/docs/custom_bundling.html
import { create, allDependencies } from 'mathjs/number';

// Create a math instance with only number support
const math = create(allDependencies);

export const evaluate = (expr) => math.evaluate(expr);
```

### Pattern 2: Lazy-Loading MathLive
**What:** Use dynamic `import()` to load the MathLive library on-demand.
**When to use:** When switching from Basic to Scientific mode.
**Example:**
```javascript
async function enableScientificMode() {
  if (!window.MathfieldElement) {
    // Dynamic import only when needed
    await import('mathlive'); 
  }
  const mfe = document.querySelector('math-field');
  mfe.hidden = false;
}
```

### Pattern 3: GPU-Accelerated Eye Tracking
**What:** Decouple `mousemove` events from style updates using `requestAnimationFrame` and CSS variables.
**When to use:** For any continuous mouse-following animation.
**Example:**
```javascript
let mouseX = 0, mouseY = 0, ticking = false;

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (!ticking) {
    requestAnimationFrame(updateEyes);
    ticking = true;
  }
});

function updateEyes() {
  const root = document.documentElement;
  root.style.setProperty('--mouse-x', `${mouseX}px`);
  root.style.setProperty('--mouse-y', `${mouseY}px`);
  ticking = false;
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Math Parsing | Custom RegEx parser | `mathjs` | Edge cases (unary operators, implicit mult), operator precedence, and security. |
| Math Input | Canvas-based input | `MathLive` | Accessibility (ARIA), virtual keyboard, and LaTeX compatibility. |
| Asset Hashing | Manual `?v=1` strings | `Vite` (Rollup) | Cache-busting accuracy and PWA manifest integration. |

## Common Pitfalls

### Pitfall 1: Event Delegation on `document`
**What goes wrong:** Attaching all click handlers to `document` or `body`.
**Why it happens:** Convenience of having one listener for everything.
**How to avoid:** Delegate to the nearest stable container (e.g., `#keypad`). This reduces the number of events processed by the handler and improves **Interaction to Next Paint (INP)**.

### Pitfall 2: `event.target` in Nested Buttons
**What goes wrong:** Clicking an icon inside a button triggers the icon, not the button listener.
**Why it happens:** `event.target` is the specific leaf node clicked.
**How to avoid:** Use `const btn = event.target.closest('button')` to find the interactive ancestor.

### Pitfall 3: Blocking Initial Load with MathLive
**What goes wrong:** Importing `mathlive` in the main bundle.
**Why it happens:** Standard ES module imports are synchronous.
**How to avoid:** Use `import()` (dynamic import) or the `<math-span>`/`<math-div>` components for static math which handle lazy-loading internally.

## Code Examples

### Optimized Event Delegation
```javascript
const keypad = document.getElementById('keypad');

keypad.addEventListener('click', (event) => {
  const button = event.target.closest('.calc-btn');
  if (!button || !keypad.contains(button)) return;
  
  const action = button.dataset.action;
  const value = button.dataset.value;
  
  handleInput(action, value);
});
```

### CSS-Variable Pupil Movement
```css
/* Update these variables via JS requestAnimationFrame */
:root {
  --pupil-x: 0px;
  --pupil-y: 0px;
}

.pupil {
  /* Use transform for GPU acceleration */
  transform: translate3d(var(--pupil-x), var(--pupil-y), 0);
  will-change: transform;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| MathJax v2 | MathLive | 2022+ | Interactive editing vs static display. |
| KaTeX | MathJax v4 | Aug 2025 | MathJax v4 closed the speed gap and added SOTA accessibility/fonts. |
| Inline Styles | CSS Variables | 2023+ | Decoupling JS logic from browser reflow cycles. |

**Deprecated/outdated:**
- **`renderMathInDocument()`**: Scans full DOM; use `renderMathInElement()` or web components in 2025.
- **`mathjs` (Full Build)**: Avoid if only using basic scientific math.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Dev / Build | ✓ | 24.13.0 | — |
| npm | Package Mgr | ✓ | 11.10.0 | — |
| Vite | Build Tool | ✓ | 8.0.3 | — |
| Playwright | Testing | ✓ | 1.58.2 | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 |
| Config file | `playwright.config.js` |
| Quick run command | `npx playwright test tests/performance.spec.js` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-P4 | Eye-tracking uses CSS variables | E2E/Perf | `npx playwright test tests/performance.spec.js` | ✅ |
| REQ-B4 | mathjs build size optimization | Build Audit | `npx vite build && du -h dist/assets/*.js` | ❌ Wave 0 |
| REQ-B4 | MathLive lazy-loading | Network | `npx playwright test tests/integration.spec.js` | ✅ |

## Sources

### Primary (HIGH confidence)
- **mathjs.org**: Documentation on `mathjs/number` and custom bundling.
- **mathlive.io**: Official guide on lazy-loading and web components (v0.108+).
- **MathJax.org**: v4.0.0 (Aug 2025) and v4.1.0 (Dec 2025) release notes.

### Secondary (MEDIUM confidence)
- **Web Vitals (2025)**: Documentation on INP (Interaction to Next Paint) and event delegation costs.
- **MDN Web Docs**: Best practices for `requestAnimationFrame` and CSS variables performance.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Libraries are current and well-documented.
- Architecture: HIGH - Patterns (rAF, lazy-loading) are industry standard for 2025.
- Pitfalls: HIGH - Common issues with event delegation and bundle size are well-known.

**Research date:** 2026-03-30
**Valid until:** 2026-05-30
