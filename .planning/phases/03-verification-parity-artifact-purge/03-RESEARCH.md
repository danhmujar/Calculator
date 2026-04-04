# Phase 03: Verification & Parity Artifact Purge - Research

**Researched:** 2026-04-04
**Domain:** Codebase Cleanup, E2E Testing, Visual Regression Verification
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Delete parity hacks completely (cleans up codebase as per "Artifact Purge").
- **D-02:** Allow minor pixel differences (WebGL vs DOM rendering often has anti-aliasing diffs).
- **D-03:** Standard Playwright traces (less overhead, standard tool).

### the agent's Discretion
None explicitly documented in CONTEXT.md.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-WGL-02 | CSS backdrop-filter is completely removed | Identify all instances of `backdrop-filter` in `ui/styles.css` (21 matches found). |
| REQ-WGL-03 | Underlay pattern properties (z-index) remain stable | Test suite in `tests/phase-01.spec.js` validates these properties; ensure test suite passes after purge. |
| (Implicit) | Parity Code Removal | `parity-*` references (e.g., `parity-webgl-only`, `parity-split-view`) found in `ui/webgl/renderer.js` must be stripped out. |
</phase_requirements>

## Summary

This phase focuses on finalizing the migration to the WebGL underlay by eliminating legacy parity tools and pure-CSS `backdrop-filter` fallbacks. The research confirms that the codebase contains multiple `backdrop-filter` definitions (21 instances) in the CSS that currently cause `tests/phase-01.spec.js` to fail. The WebGL renderer also contains conditional logic (`parity-webgl-only`, `parity-split-view`) that is now obsolete. 

**Primary recommendation:** Aggressively strip `backdrop-filter` from CSS and remove `parity-*` checks from `renderer.js`, then use Playwright traces with configured pixel difference tolerances to validate visual stability.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Playwright | ^1.58.2 | E2E & Visual Regression | Project standard (`package.json` configures `@playwright/test`); native visual diffing. |
| WebGL 2.0 | N/A | Underlay Rendering | User constraint: No heavy 3D wrappers permitted. |

**Installation:**
No new installations required. Existing stack covers requirements.

## Architecture Patterns

### Recommended Project Structure
Existing structure is maintained. No structural refactoring is required for this purge.

### Pattern 1: E2E Visual Parity with Tolerance
**What:** Using Playwright's `toHaveScreenshot` with explicit tolerances.
**When to use:** When comparing DOM-rendered blur (CSS `backdrop-filter`) against GPU-rendered blur (WebGL Kawase), which inherently have minor anti-aliasing and blending differences.
**Example:**
```javascript
// Source: Playwright Official Docs for Visual Comparisons
await expect(page).toHaveScreenshot('underlay.png', {
  maxDiffPixelRatio: 0.05, // Allow up to 5% difference (D-02)
});
```

### Anti-Patterns to Avoid
- **Ghost Conditionals:** Leaving `if (document.body.classList.contains('parity-webgl-only'))` checks in the rendering loop after the toggle UI is removed.
- **Over-strict Diffing:** Expecting perfect 0-pixel differences between CSS and WebGL blurs.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Visual Diffing | Custom Canvas Pixel Comparison | Playwright `toHaveScreenshot()` | Native HTML reporting, threshold configurations, and trace viewers come out-of-the-box. |

**Key insight:** The project is already configured for Playwright. We should leverage its built-in configuration for traces (`trace: 'on-first-retry'`) rather than building custom artifact generators.

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `interactiveCalcState` and `calcSidebarWidth` in `localStorage` | None — verified they do not cache parity modes. |
| Live service config | None | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | Playwright reports in `test-results/` and `playwright-report/` | Overwritten automatically by `npx playwright test`. |

## Common Pitfalls

### Pitfall 1: Incomplete CSS Removal
**What goes wrong:** Playwright tests checking for `backdrop-filter` absence fail.
**Why it happens:** Missing vendor prefixes (`-webkit-backdrop-filter`) during the purge.
**How to avoid:** Search specifically for both `backdrop-filter` and `-webkit-backdrop-filter`. The current CSS has 21 matches across both variations.

### Pitfall 2: Broken Fallback Rendering
**What goes wrong:** WebGL context stops clearing when `parity-webgl-only` is removed.
**Why it happens:** The main render loop in `renderer.js` currently uses `parity-*` classes to guard its clearing logic.
**How to avoid:** Refactor the guard in `renderer.js:496` to purely rely on `webgl-active` and remove the parity checks entirely without breaking the `this.context.clear()` fallback.

## Code Examples

### Purged Renderer Guard
```javascript
// Current logic (ui/webgl/renderer.js:496)
if (!document.body.classList.contains('webgl-active') && 
    !document.body.classList.contains('parity-webgl-only') &&
    !document.body.classList.contains('parity-split-view')) {
    this.context.clear([0, 0, 0, 0]);
    this.instanceCount = 0;
    return;
}

// Target Purged Logic
if (!document.body.classList.contains('webgl-active')) {
    this.context.clear([0, 0, 0, 0]);
    this.instanceCount = 0;
    return;
}
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/Test | ✓ | v24.13.0 | — |
| Playwright | Test Suite | ✓ | 1.58.2 | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 |
| Config file | `playwright.config.js` |
| Quick run command | `npx playwright test tests/phase-01.spec.js` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-WGL-02 | CSS backdrop-filter is completely removed | E2E DOM inspection | `npx playwright test tests/phase-01.spec.js -g "REQ-WGL-02"` | ✅ Wave 0 |
| REQ-WGL-03 | Underlay pattern properties stable | E2E DOM inspection | `npx playwright test tests/phase-01.spec.js -g "REQ-WGL-03"` | ✅ Wave 0 |
| D-01 | WebGL parity artifacts removed | Unit/E2E | `npx playwright test tests/phase-02.spec.js` | ✅ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx playwright test tests/phase-01.spec.js`
- **Per wave merge:** `npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements. Both `phase-01.spec.js` and `phase-02.spec.js` are in place.

## Sources

### Primary (HIGH confidence)
- `tests/phase-01.spec.js` - Confirmed existing test checking for absence of `backdrop-filter`.
- `ui/webgl/renderer.js` - Identified obsolete `parity-webgl-only` and `parity-split-view` guards.
- `ui/styles.css` (via grep) - Confirmed 21 references to `backdrop-filter` and `-webkit-backdrop-filter`.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Directly reading `package.json`.
- Architecture: HIGH - Dictated by strict project constraints.
- Pitfalls: HIGH - Based on current failing Playwright logs (`test_output_2.txt`).

**Research date:** 2026-04-04
**Valid until:** 2026-05-04
