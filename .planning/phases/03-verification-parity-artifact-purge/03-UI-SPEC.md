---
status: draft
---

# Phase 03: Verification & Parity Artifact Purge - UI Design Contract

## 1. Design Tokens

### Spacing
The following 4-point scale must be maintained for all UI elements:
- **Scale:** 4, 8, 16, 24, 32, 48, 64
- **Phase Exception:** No new UI elements are being introduced. Existing spacing rules remain locked.

### Typography
The existing typography engine and font stacks must be preserved unchanged.
- **Sizes:** 14px (metadata), 18px (base), 24px (digits), 48px (symbols).
- **Weights:** Regular (400) and Bold (700).
- **Line Height:** 1.5 (Standard body), 1.2 (Headings/Display).

### Color
The 60/30/10 color split defined in Phase 2 remains strictly in effect.
- **Dominant (60%):** `--bg-color` / `uBgColor` (Base background)
- **Secondary (30%):** `--panel-bg` / `uPanelBg` (Calculator cards, glass panels)
- **Accent (10%):** `--primary-blue` / `uAccentColor` (Active buttons, primary actions)
- **Destructive:** `--error-red` / `uDestructiveColor` (Clear/Delete actions only)

## 2. Visual Contract: Strict Visual Parity

Phase 3 demands strict validation of the WebGL underlay against legacy CSS implementations.
- **Requirement:** WebGL rendered aurora gradients and blurred edges must visually match the output of the original CSS (`backdrop-filter`) implementations perfectly, within a strict tolerance.
- **Tolerance:** `maxDiffPixelRatio: 0.05` (allow up to 5% difference due to WebGL vs DOM rendering anti-aliasing diffs, as decided in D-02).
- **Purge Requirement:** All CSS `backdrop-filter` rules (including vendor prefixes like `-webkit-backdrop-filter`) must be completely purged from `ui/styles.css` (REQ-WGL-02).
- **Toggle Stability:** Z-index stacking contexts must remain stable across all dynamic states. Expanding the scientific mode and changing CSS themes cannot visually break the layering.

## 3. Interaction Contract: Stacking and Event Passthrough

- **Stacking:** The `<canvas id="webgl-underlay">` and DOM `<main>` must maintain absolute sibling segregation, forcing independent stacking contexts.
- **Event Passthrough:** The canvas must successfully maintain `pointer-events: none` at all times, ensuring the canvas never hijacks clicks intended for the calculator UI.
- **Conditionals Purge:** All legacy CSS parity classes (`parity-webgl-only`, `parity-split-view`) must be completely purged from both CSS and the `ui/webgl/renderer.js` render loops. The fallback clearing logic must rely purely on `webgl-active`.

## 4. Copywriting Contract

Since Phase 3 introduces no new UI components, the copywriting contract remains unchanged from Phase 2.
- **Primary CTA:** None in this phase.
- **Empty State:** N/A
- **Error State:** N/A
- **Destructive Actions:** "Purge Parity Artifacts" (Developer action, automated by tests)

## 5. Implementation Guardrails

### Accessibility (A11y)
- The WebGL canvas must remain `aria-hidden="true"`.
- The strict DOM separation must be preserved for screen reader compatibility.

### Verification Tools
- Use standard Playwright traces for visual verification (D-03).
- Do not build custom canvas pixel comparison tools. Leverage Playwright's `toHaveScreenshot()` with the defined tolerance.

## 6. Component Registry

| Component | Path | Status |
|-----------|------|--------|
| `styles` | `ui/styles.css` | To be modified (Purge `backdrop-filter`) |
| `webgl-renderer` | `ui/webgl/renderer.js` | To be modified (Purge parity conditionals) |
