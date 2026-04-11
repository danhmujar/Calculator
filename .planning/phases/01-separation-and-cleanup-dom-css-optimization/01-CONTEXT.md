# Phase 1: Separation and Cleanup (DOM & CSS Optimization) - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Separate the WebGL underlay fully by eliminating legacy CSS interactions and stabilizing the stacking context to prevent z-index regressions.
</domain>

<decisions>
## Implementation Decisions

### Fallback Behavior

- **D-01:** If WebGL fails to initialize (e.g., due to hardware support limits), failover to a solid, flat background color. All legacy CSS `backdrop-filter` rules must be strictly eliminated with no reliance on them to avoid compounded technical debt.

### Structural Isolation

- **D-02:** Use a flat sibling structure at the highest sensible level (sibling to the calculator wrapper container) for maximum z-index isolation. The `<canvas id="webgl-underlay">` must live beside, not inside, the `<main>` UI layout.

### the agent's Discretion

- HTML refactoring to achieve the flat sibling structure.
- Implementation details regarding CSS cleanup inside `ui/styles.css`.
  </decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Infrastructure Research

- `.planning/research/ARCHITECTURE.md` — Component boundaries and data flow
- `.planning/research/PITFALLS.md` — Context regarding z-index resets
- `.planning/research/FEATURES.md` — Performance vs visual trade-offs
  </canonical_refs>
