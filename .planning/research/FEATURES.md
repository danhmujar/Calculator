# Feature Landscape: Math Calculator

**Domain:** Math Utility
**Researched:** 2024-03-29

## Table Stakes

Features users expect in a modern calculator.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| History / Tape | Users need to review previous calculations. | Medium | Use a scrolling view, optimize with DocumentFragment. |
| Undo / Redo | Error correction. | Medium | Use Command Pattern for memory efficiency. |
| Precise Math | Financial/scientific work. | Medium | Requires Math.js. |
| Keyboard Support | Speed of entry. | Low | Bind to standard key codes. |

## Differentiators

Features that set this product apart.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Formula Editor | Real-time LaTeX display for readable equations. | High | Requires MathLive integration. |
| Variable Support | Use previous results as variables (Ans). | Medium | State management within Math.js scope. |
| Offline First | Works on the plane/train without internet. | Medium | Requires vite-plugin-pwa. |
| Dark Mode | Modern UI standard. | Low | Use CSS variables and prefers-color-scheme. |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full Graphing | Massive scope creep, performance hit. | Focus on expression evaluation and formula editing. |
| Cloud Sync | Privacy concerns, offline-first goal. | Use LocalStorage for local history sync. |

## Feature Dependencies

```
Basic UI Core → State Management
State Management → Math Engine (Math.js)
Math Engine → Formula Editor (MathLive)
Offline Support → Full App Readiness
```

## MVP Recommendation

Prioritize:
1. **Precise Core:** Math.js based expression evaluator.
2. **Smooth UI:** Vanilla JS event-driven interface.
3. **Formula Display:** MathLive integration (lazy-loaded).

Defer: **Custom Variables:** Add in Phase 5 after basic evaluation is stable.

## Sources

- [Math.js Functionality](https://mathjs.org/docs/index.html)
- [Competitive Analysis: Desmos, Calculator.net]
