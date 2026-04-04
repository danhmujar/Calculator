# Phase 3: Verification & Parity Artifact Purge - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Strip dead code related to historical transitions and validate end-state against requirements.
</domain>

<decisions>
## Implementation Decisions

### Parity Code Removal
- **D-01:** Delete parity hacks completely (cleans up codebase as per "Artifact Purge").

### Test Suite Strictness
- **D-02:** Allow minor pixel differences (WebGL vs DOM rendering often has anti-aliasing diffs).

### Regression Artifacts
- **D-03:** Standard Playwright traces (less overhead, standard tool).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tests
- `tests/phase-01.spec.js` — Regression tests for Phase 1
- `tests/phase-02.spec.js` — Regression tests for Phase 2
- `playwright.config.js` — Playwright configuration settings
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ui/webgl/renderer.js`: Contains the legacy parity checks (e.g., `parity-webgl-only`, `parity-split-view`).

### Established Patterns
- Playwright tests are currently in the `tests/` directory and use standard traces.

### Integration Points
- `ui/webgl/renderer.js` and CSS styles need to be purged of `parity-*` references.
</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope
</deferred>

---

*Phase: 03-verification-parity-artifact-purge*
*Context gathered: 2026-04-04*