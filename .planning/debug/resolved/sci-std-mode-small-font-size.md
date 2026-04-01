---
status: investigating
trigger: "Investigate and fix a layout/rendering bug in the Calculator: 1. Small Display Size: When switching from Scientific (SCI) to Standard (STD) mode, the initial value '0' appears in a very small font size. 2. Self-Correction: Clicking the 'C' (Clear) button fixes the size, suggesting a manual state update triggers a correct re-render that the mode switch is missing or performing too early. Examine 'Renderer.fitDisplayText' and 'UIManager.toggleScientificMode' for race conditions where the display size is measured before the layout has settled, or where a 'requestAnimationFrame' or 'ResizeObserver' might be needed to ensure stable measurement."
created: 2025-02-14T12:00:00Z
updated: 2025-02-14T12:00:00Z
---

## Current Focus

hypothesis: Initial rendering after SCI to STD toggle happens while `.calc-display` is `display: none`, resulting in `containerWidth` being 0 (or negative after padding subtraction). This causes `fitDisplayText` to calculate the minimum font size (1.0rem).
test: Add `ResizeObserver` to `UIManager` to ensure font size is updated when layout settles.
expecting: Correct font size once the container becomes visible and its width is non-zero.
next_action: Apply fixes to `ui/uimanager.js`.

## Symptoms

expected: Initial value '0' should have correct standard font size after mode switch
actual: Initial value '0' appears in a very small font size
errors: []
reproduction: 1. Open Calculator. 2. Switch to Scientific mode. 3. Switch back to Standard mode. 4. Observe '0' font size. 5. Click 'C' to fix.
started: Always/Recently reported

## Eliminated

- hypothesis: [none]
  evidence: [none]
  timestamp: [none]

## Evidence

- timestamp: 2025-02-14T12:00:00Z
  checked: Initial trigger
  found: User reports small font size '0' on mode switch
  implication: Likely measurement-layout race condition
- timestamp: 2025-02-14T12:10:00Z
  checked: `ui/styles.css`
  found: `body.scientific-mode .calc-display` has `display: none`.
  implication: Measurement of `clientWidth` will be 0 when this class is present.
- timestamp: 2025-02-14T12:15:00Z
  checked: `ui/uimanager.js` - `setCalcMode`
  found: `store.state.persistent.mode = mode` happens BEFORE `document.body.classList.remove('scientific-mode')` which is wrapped in a `requestAnimationFrame`.
  implication: `updateDisplay` is triggered while the class is still present, leading to measurement of a hidden (0-width) element.

## Resolution

root_cause: Race condition where `updateDisplay` was triggered (via store change) while `scientific-mode` was still on `body`. This caused `.calc-display` to be `display: none`, leading to `containerWidth` being 0 or negative. `Renderer.fitDisplayText` then calculated the minimum font size (1.0rem) due to the zero/negative width.
fix: 1. Added `ResizeObserver` to `UIManager` to automatically handle layout transitions and sidebar resizing. 2. Moved store updates in `setCalcMode` and `activateScientificMode` into `requestAnimationFrame` callbacks to ensure consistency with layout state. 3. Added defensive logic to `Renderer.fitDisplayText` to return `maxRem` (instead of `minRem`) when `containerWidth` is <= 0.
verification: Manual verification needed by user. Self-verified logic through code analysis and race condition modeling.
files_changed: [ui/uimanager.js, ui/renderer.js]
