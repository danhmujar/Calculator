# Phase 6: Architectural Hardening - Research

**Researched:** 2025-05-15
**Domain:** Architectural Refactoring, State Optimization, Security Hardening
**Confidence:** HIGH

## Summary

This phase focuses on transitioning the calculator from a 1,200-line monolithic God Object (`services/app.js`) to a modular, service-oriented architecture. The research identifies established patterns for Vanilla JS decomposition, efficient state management via Lazy Shallow Cloning, and robust initialization sequences for third-party components (MathLive). Security hardening of the mathematical engine (`mathjs`) is addressed through restrictive configurations and AST-based whitelisting.

**Primary recommendation:** Implement a Service-Layer pattern with a Render-Agnostic Store and a Copy-on-Write State Proxy to achieve O(1) reads and stable references for the upcoming WebGL migration.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `mathjs` | ^11.0.0 | Scientific calculation | Industry standard for JS math; extensive security hooks. |
| `mathlive` | ^0.90.0 | Math input UI | Best-in-class accessible math editor with Web Component support. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| `crypto.randomUUID` | Native | Unique ID generation | Native browser support, no extra dependency. |
| `Intl.NumberFormat` | Native | Localized formatting | High performance, native, handles complex locales. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `math.evaluate` | `math.compile` | `compile` is faster for repeated execution but adds complexity for single-shot row results. |
| `JSON.stringify` | `Immer` | `Immer` provides excellent ergonomics but adds 5KB+ to bundle; custom Proxy is zero-dependency. |

**Installation:**
```bash
npm install mathjs mathlive
```

## Architecture Patterns

### Recommended Project Structure
```
services/
├── app.js            # Main orchestrator (Entry point)
├── store.js          # Centralized State Management (Render-agnostic)
├── calculator.js     # Pure business logic & row calculation
├── pwa.js            # PWA & Service Worker management
└── events.js         # Centralized event delegation & bindings
ui/
├── renderer.js       # Measurement & layout engine (Canvas-based)
├── uimanager.js      # DOM/Canvas coordination (New)
└── eye-tracker.js    # Specialized UI interactions
```

### Pattern 1: Service Layer & Strangler Pattern
**What:** Extracting logical domains (Data, Logic, UI) into independent modules.
**When to use:** Decomposing the `app.js` monolith.
**Example:**
```javascript
// services/calculator.js
export class CalculatorService {
  static calculateRow(type, x, y) {
    // Pure logic, no DOM references
  }
}

// services/events.js
export function bindKeypadEvents(onDigit, onAction) {
  document.getElementById('calc-keypad').addEventListener('click', (e) => {
    // Delegation logic
  });
}
```

### Pattern 2: Lazy Shallow Cloning (Copy-on-Write)
**What:** A Proxy-based state manager that only clones the path to the modified property, preserving structural sharing.
**When to use:** Optimizing `services/store.js` for O(1) reads and efficient writes.
**Example:**
```javascript
const handler = {
  get(target, prop) {
    const value = target[prop];
    return (typeof value === 'object' && value !== null) ? new Proxy(value, handler) : value;
  },
  set(target, prop, value) {
    if (target[prop] === value) return true;
    // Notify store of change for shallow cloning up the tree
    store.dispatchUpdate(target, prop, value);
    return true;
  }
};
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Deep Cloning | Custom recursive clone | `{...spread}` or `Object.assign` | Native, optimized, and sufficient for shallow patterns. |
| LRU Cache | Complex linked-list | `Map` + Re-insertion | ES6 `Map` insertion order preservation makes LRU trivial and O(1). |
| Math Parsing | Custom regex/eval | `math.parse` (AST) | Security: regex is bypassable; `eval` is dangerous. |

**Key insight:** Modern JavaScript engines optimize `Map` and object spreads so heavily that custom "low-level" optimizations often perform worse than native idioms.

## Common Pitfalls

### Pitfall 1: MathLive Initialization Race Condition
**What goes wrong:** Calling `.setValue()` or `.focus()` on a `<math-field>` before it has "upgraded" from a generic element.
**Why it happens:** The custom element registration is asynchronous.
**How to avoid:** Use the `mount` event or `customElements.whenDefined`.

### Pitfall 2: Memory Leaks in Text Caching
**What goes wrong:** `textWidthCache` grows indefinitely as users type unique expressions.
**Why it happens:** `Map` is used as a simple cache without an eviction policy.
**How to avoid:** Implement a fixed-capacity LRU strategy.

### Pitfall 3: MathJS Prototype Pollution
**What goes wrong:** Malicious expressions accessing `.constructor` or `.prototype`.
**Why it happens:** Default `math.evaluate` allows certain property accessors.
**How to avoid:** Traverse the AST with `node.traverse` and block `AccessorNode`.

## Code Examples

### Optimized LRU Cache for Renderer
```javascript
// Source: Community Best Practice (Map-based LRU)
class LRUCache extends Map {
  constructor(capacity) {
    super();
    this.capacity = capacity;
  }
  get(key) {
    if (!super.has(key)) return undefined;
    const val = super.get(key);
    super.delete(key);
    super.set(key, val);
    return val;
  }
  set(key, value) {
    if (super.has(key)) super.delete(key);
    super.set(key, value);
    if (this.size > this.capacity) {
      this.delete(this.keys().next().value);
    }
    return this;
  }
}
```

### Event-Driven MathLive Initialization
```javascript
// Source: MathLive Official Documentation
async function restoreMathField(mf, value) {
  await customElements.whenDefined('math-field');
  mf.addEventListener('mount', () => {
    mf.setValue(value);
    mf.focus();
  }, { once: true });
}
```

### Secure MathJS Configuration
```javascript
// Source: mathjs Security Guide
const math = create(all, {
  predictable: true,
  matrix: 'Array'
});

// Disable high-risk functions
const unsafe = ['import', 'createUnit', 'evaluate', 'parse', 'simplify'];
unsafe.forEach(fn => { math[fn] = () => { throw new Error('Disabled'); } });

function safeEvaluate(expr, scope = {}) {
  const node = math.parse(expr);
  node.traverse((n) => {
    if (n.type === 'AccessorNode') throw new Error('Illegal Access');
    // Add additional whitelisting for SymbolNode/FunctionNode here
  });
  return node.evaluate(scope);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `setTimeout` for restoration | `mount` event | MathLive v0.70+ | Zero race conditions. |
| `JSON.stringify` state cloning | Proxy + Structural Sharing | Modern ES6+ | O(1) state reads, no GC thrashing. |
| `innerHTML` templates | `createElement` + `textContent` | Security Hardening | Immune to XSS via template injection. |

**Deprecated/outdated:**
- `SCI_RESTORE_DELAY_BASE_MS`: No longer needed with event-driven restoration.
- `JSON.stringify(this.state)`: Replaced by shallow snapshots.

## Open Questions

1. **WebGL Compatibility:** Will the shallow-cloned state references be stable enough for WebGL buffer updates without redundant diffing? 
   - *Recommendation:* Ensure the store emits "change paths" to allow the WebGL layer to perform partial buffer updates.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `mathjs` | Calculation | ✓ | 11.8.0 | — |
| `mathlive` | Scientific Mode | ✓ | 0.94.1 | — |
| `crypto.randomUUID` | ID Generation | ✓ | Native | `Math.random().toString(36)` |
| `requestAnimationFrame` | UI Batching | ✓ | Native | `setTimeout(cb, 16)` |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (E2E) + Vitest (Unit) |
| Config file | `vite.config.js` |
| Quick run command | `npm test` |
| Full suite command | `npm run test:e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-ARCH-01 | App logic is modularized | Unit | `npm test services/calculator.spec.js` | ❌ Wave 0 |
| REQ-STORE-01 | State reads are O(1) | Perf | `npm test tests/performance.spec.js` | ✅ |
| REQ-BUG-01 | Rows restore without races | E2E | `npx playwright test tests/scientific.spec.js` | ✅ |
| REQ-SEC-02 | MathJS is restricted | Security | `npm test tests/security.spec.js` | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `tests/security.spec.js` — Verify MathJS restrictions and AST blocking.
- [ ] `services/calculator.spec.js` — Unit tests for the new decoupled calculation service.

## Sources

### Primary (HIGH confidence)
- `mathlive` - Official Docs (Lifecycle Events & Mount)
- `mathjs` - Official Docs (Security configuration & AST traversal)
- MDN - `Proxy` and `Map` documentation

### Secondary (MEDIUM confidence)
- Valtio / Immer architectural patterns for Vanilla JS state management.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Libraries are well-documented.
- Architecture: HIGH - Service Layer is a proven pattern.
- Pitfalls: HIGH - Common MathLive/MathJS issues are well-known.

**Research date:** 2025-05-15
**Valid until:** 2025-06-15
