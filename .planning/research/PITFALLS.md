# Domain Pitfalls: Math Calculator

**Domain:** Math Utility
**Researched:** 2024-03-29

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Library Bloat (Math.js / MathLive)
**What goes wrong:** Both libraries are massive (>1MB total). Initial load time is high, leading to poor Lighthouse scores and user frustration.
**Why it happens:** Standard `import * from 'mathjs'` includes every function (trig, matrices, etc.).
**Prevention:** Use `mathjs/number` or custom builds. Lazy-load MathLive.
**Detection:** Vite build report showing large chunks.

### Pitfall 2: Layout Thrashing
**What goes wrong:** Display updates become sluggish, especially when scrolling history.
**Why it happens:** Reading `historyElement.scrollHeight` and then setting `historyElement.scrollTop = ...` inside a loop.
**Prevention:** Use `requestAnimationFrame` and batch DOM writes.
**Detection:** "Long Tasks" or "Forced Reflow" warnings in Chrome DevTools Performance tab.

## Moderate Pitfalls

### Pitfall 1: Binary Floating Point Precision
**What goes wrong:** `0.1 + 0.2 = 0.30000000000000004`.
**Why it happens:** Standard IEEE 754 float behavior in JS.
**Prevention:** Use `math.add()` and `math.format()` from Math.js which uses BigNumber/Fraction types.

### Pitfall 2: MathLive Registration Race
**What goes wrong:** The `<math-field>` custom element doesn't render correctly because it wasn't registered when the DOM was parsed.
**Why it happens:** Dynamic imports of MathLive happen after the element is in the DOM.
**Prevention:** Use the `:not(:defined)` CSS selector to hide it and show a loading state.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Math.js Integration | Missing dependencies in custom build. | Test each function (add, evaluate) as it's added. |
| MathLive Layout | FOUC (Flash of Unstyled Content). | Use visibility: hidden until element is defined. |
| PWA Service Worker | Users on old cached versions. | Implement "Update Prompt" UI. |

## Sources

- [Math.js Documentation on BigNumbers](https://mathjs.org/docs/datatypes/bignumbers.html)
- [MathLive Documentation on Performance](https://mathlive.io/docs/integration/performance/)
