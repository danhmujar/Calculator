---
status: resolved
trigger: "Investigate and fix WebGL verification markers visibility on mobile (width <= 1024px) when the calculator drawer is open."
created: 2026-04-01T02:16:00Z
updated: 2026-04-01T02:40:00Z
---

## Current Focus

hypothesis: Fixed. Mobile drawer markers are visible due to semi-transparent background and improved DOM tracking.
test: `tests/mobile-markers.spec.js` and `tests/renderer.spec.js`.
expecting: All tests pass.
next_action: Archive session.

## Symptoms

expected: WebGL verification markers should be visible on mobile (width <= 1024px) when the calculator drawer is open.
actual: WebGL verification markers are not visible on mobile when the drawer is open.
errors: []
reproduction: 
1. Open the calculator on a mobile device or resize window to width <= 1024px.
2. Open the calculator drawer.
3. Observe WebGL verification markers.
started: Always broken/Recently noticed during mobile testing.

## Eliminated

## Evidence

- timestamp: 2026-04-01T02:22:00Z
  checked: `ui/webgl/context.js`
  found: WebGL canvas has `zIndex: '-1'` and `position: 'fixed'`.
  implication: It is an underlay. Any element on top must be semi-transparent to see it.
- timestamp: 2026-04-01T02:23:00Z
  checked: `ui/styles.css`
  found: `.right-panel` (the drawer) has opaque `background-color: var(--panel-bg);`. On mobile, it covers the whole screen (`width: 100vw`).
  implication: The drawer obscures the underlay completely on mobile.
- timestamp: 2026-04-01T02:24:00Z
  checked: `ui/uimanager.js`
  found: No `webgl-active` class added to `body`.
  implication: Styles cannot easily target the case where WebGL is active.
- timestamp: 2026-04-01T02:25:00Z
  checked: `ui/webgl/renderer.js`
  found: `getActiveDisplayElement` might need refinement for mobile drawer, and `render()` has guards that might be strict for mobile transitions.
  implication: Markers might not be rendered or targeted correctly on mobile.

## Resolution

root_cause: Opaque background on mobile drawer hides WebGL underlay markers, and missing DOM tracking/render triggers during drawer operations.
fix: Add `webgl-active` class to body, implement semi-transparent backgrounds for panels in CSS, refine `getActiveDisplayElement` for mobile drawer, adjust visibility guards, and ensure drawer toggles trigger rendering.
verification: Verified with `tests/mobile-markers.spec.js` and `tests/renderer.spec.js` in mobile and desktop viewports.
files_changed: [ui/uimanager.js, ui/webgl/renderer.js, ui/styles.css]
