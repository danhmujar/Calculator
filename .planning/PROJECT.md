# WebGL Infrastructure Finalization

Finalizing the transition of the Percentage & Math Calculator to a GPU-accelerated rendering architecture using WebGL/Three.js.

## Context
The application is migrating from heavy CSS `backdrop-filter` and gradient effects to a high-performance WebGL underlay. The foundational WebGL passes have been implemented, but the current state suffers from z-index stacking context regressions, DOM integration glitches (especially during scientific mode expansion), and failing test cases. This milestone is dedicated entirely to completing this migration, achieving rock-solid stability, and replacing legacy CSS rendering while maintaining strict visual parity with the original design.

## Requirements

### Validated
- ✓ 3-Tier Architecture separation (Services, UI DOM layer, WebGL layer) — existing structure.
- ✓ Base WebGL rendering architecture (Context, Buffers, Shaders) — existing.
- ✓ Interactive DOM UI for 4 percentage types and scientific calculator mode — existing.

### Active
- [ ] **Remove Redundant CSS:** Strip out all legacy CSS `backdrop-filter` rules to rely 100% on the WebGL compositor.
- [ ] **Fix Z-Index & Stacking:** Implement stable z-index layering to ensure the DOM calculator perfectly floats above the WebGL underlay without visually breaking on mode toggles.
- [ ] **Strict Visual Parity:** The WebGL-rendered Aurora themes must be visually identical (100% parity) to the previous pure CSS implementation.
- [ ] **Clean Parity Artifacts:** Remove obsolete testing scaffolding and legacy CSS variables/classes tightly coupled to the old parity checks.
- [ ] **Test Verification:** Ensure all Playwright automated tests (specifically the "Underlay Pattern" checks) pass flawlessly on the new architecture.

### Out of Scope
- **New 3D Features (Particles, Graphing, Post-processing):** — Kept out of scope to strictly prioritize architectural stability and performance of the base foundation first.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Focus exclusively on stability | The WebGL layer is currently transitional and causing regressions. Solidifying the base is more important than adding visual flair right now. | Pending |
| Enforce strict visual parity | End-users love the Aurora theme; the backend shift should be completely invisible apart from smoother frame rates. | Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: April 2026 after initialization*
