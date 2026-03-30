# Architecture Patterns: Optimized Math Calculator

**Domain:** Math Utility
**Researched:** 2024-03-29

## Recommended Architecture

A **State-Driven, Single-Threaded** architecture using the **Command Pattern** for state transitions and `requestAnimationFrame` for rendering.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Store | Holds current expression and history. | Calculator Engine |
| Calculator Engine | Wraps Math.js to evaluate expressions. | Store |
| UI Renderer | Updates DOM based on Store state. | Store |
| Event Handler | Listens for inputs and dispatches Commands. | Store, Renderer |

### Data Flow

```
User Input (Click/Key) → Event Handler 
Event Handler → New Command() 
New Command() → Store.dispatch()
Store.updateState() → requestAnimationFrame(Renderer.render)
Renderer.render() → Update DOM (Display, History)
```

## Patterns to Follow

### Pattern 1: Command Pattern
**What:** Each user action (Digit, Operator, Equals) is encapsulated in a Command object.
**Why:** Enables low-memory undo/redo and audit logging.
**Example:**
```javascript
class AddDigitCommand {
  constructor(digit) { this.digit = digit; }
  execute(state) { 
    state.currentExpression += this.digit; 
  }
}
```

### Pattern 2: RequestAnimationFrame Batching
**What:** Queue UI updates and only execute them once per frame.
**Why:** Prevents layout thrashing and ensures smooth interactions.
**Example:**
```javascript
let isTicking = false;
function requestRender() {
  if (!isTicking) {
    requestAnimationFrame(() => {
      renderDOM();
      isTicking = false;
    });
    isTicking = true;
  }
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Direct DOM Manipulation from Listeners
**What:** Updating the display directly inside `onclick`.
**Why bad:** Leads to inconsistent state and performance bottleneck when multiple events fire rapidly.
**Instead:** Update the Store and trigger a render cycle.

## Scalability Considerations

| Concern | 1-100 Operations | 100-1000 Operations | 1000+ Operations |
|---------|--------------|--------------|-------------|
| History Size | Array-based. | Sliding window (pop oldest). | LocalStorage sync. |
| Math Engine | Initialized. | Re-use instance. | Worker thread evaluation? |

## Sources

- [Patterns.dev: Command Pattern](https://www.patterns.dev/posts/command-pattern/)
- [MDN: Rendering Performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Fundamentals/Rendering_Performance)
