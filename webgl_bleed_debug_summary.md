# Debugging Summary: WebGL Bleeding Artifact

This document summarizes the debugging process for a persistent visual artifact—a blue/purple "bleed"—appearing in the lower-left of the UI, contrary to the WebGL clipping and rendering logic.

## Initial Problem

The WebGL underlay, intended only for the right-hand calculator panel, was "bleeding" into the left panel. The initial implementation plan was to apply a strict `gl.scissor` test to clip all WebGL rendering to the sidebar's DOM rectangle.

## Debugging Steps & Approaches

Our debugging process followed several hypotheses, progressively narrowing down the cause.

### 1. WebGL Scissor/Clip Implementation

*   **Approach:** Implement and refine the `gl.scissor` test to ensure it was pixel-perfect.
*   **Fixes Tried:**
    1.  **Initial Scissoring:** Modified `ui/webgl/renderer.js` to accept a `clippingRect` and apply `gl.scissor`. The state of the scissor test was preserved during the multi-pass composite stage.
    2.  **Rounding Logic (Attempt 1):** The initial `Math.floor`/`Math.ceil` logic was suspected of causing sub-pixel errors. It was updated to a more robust calculation (`Math.ceil` for start, `Math.floor` for size) to prevent rounding errors.
    3.  **DPR Standardization:** Discovered a mismatch where the WebGL context capped `devicePixelRatio` at `2.0`, but the renderer did not. Standardized the DPR calculation across all rendering files to ensure the scissor test used the correct physical resolution.
    4.  **Tighter Clipping:** To gain stricter control, the clipping rectangle in `ui/uimanager.js` was changed from the entire `sidebar` to only the `#main-calc-display` element.

*   **Outcome:** All WebGL-based fixes failed to resolve the issue. The artifact persisted even when the WebGL rendering area was confined to a small rectangle on the opposite side of the screen. This led to the conclusion that WebGL was not the source.

### 2. State & Configuration Verification

*   **Approach:** Verify that the application was in the correct state for the "pure WebGL" mode to be active.
*   **Fixes Tried:**
    1.  **Playwright Test:** Used Playwright to headlessly launch the app and inspect the `<body>` element's class list.
    2.  **Confirmation:** The test reported `PLAYWRIGHT REPORT: webgl-active`, confirming the application was correctly running in pure WebGL mode.

*   **Outcome:** This confirmed that the WebGL pipeline was active, but also deepened the mystery, as the active WebGL pipeline should have been successfully clipped.

### 3. CSS Fallback Investigation (Root Cause)

*   **Hypothesis:** The visual artifact was not from WebGL, but from a legacy CSS fallback that was failing to be disabled.
*   **Approach:** Inspect `ui/styles.css` for any rules that could be creating a full-screen blue/purple gradient or pseudo-element.
*   **Fixes Tried:**
    1.  **Selector Correction:** Identified an incorrect CSS selector (`.webgl-active body.theme-aurora`) intended to disable the CSS aurora and corrected it (`body.webgl-active.theme-aurora`). This did not resolve the issue.
    2.  **Force-Hiding:** Added a high-priority rule (`visibility: hidden !important;`) to forcefully hide the `::before` pseudo-element responsible for the CSS aurora.
    3.  **Final Fix - Complete Removal:** Realizing that a "pure WebGL" setup should have no CSS fallback, the entire CSS block related to the `body::before` aurora effect and its animations was **deleted** from `ui/styles.css`.

## Final Conclusion

The persistent "blue bleed" was caused by a legacy CSS-based aurora effect defined on a `body::before` pseudo-element. This fallback was intended to be disabled when the `webgl-active` class was present, but the CSS override rules were incorrect and failed to apply. The definitive solution was not to patch the override, but to **remove the legacy CSS effect entirely**, aligning the codebase with the "pure WebGL" architectural goal.
