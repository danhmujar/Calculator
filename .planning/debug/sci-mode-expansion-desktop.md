# Debug Session: SCI Mode Expansion Desktop

## Objective
Investigate why SCI mode is not expanding in full on desktop, leaving lots of whitespace and lacking the numeric keypad. Additionally, the `panel-resizer` (draggable separator) disappears from the DOM when switching to SCI mode.

## Symptoms
- **Expected**: SCI mode should utilize the full width allocated (or at least provide controls) and the resizer should remain interactive to allow resizing both panels.
- **Actual**: SCI panel is sparse (just a math-field and button), resizer disappears, and there are OTS font parsing errors (KaTeX).
- **Errors**: `OTS parsing error: invalid sfntVersion` for KaTeX fonts.
- **Reproduction**: 
    1. Launch app in desktop-sized viewport (>1024px).
    2. Switch from STD to SCI mode.
    3. Observe resizer disappearance and sparse right panel.

## Investigation Log

### 2026-04-01 11:55 (Subagent)
- Verified `panel-resizer` has `opacity: 0` and `pointer-events: none` when `body` has `.scientific-mode`.
- Found that `.left-panel` is not hidden on desktop because the CSS selector `body.scientific-mode #sidebar.open ~ .left-panel` is invalid (the left panel is a preceding sibling, or not a subsequent sibling of the open sidebar in the way expected).

## Root Cause Found
1. **Designed Invisibility**: The resizer is intentionally hidden in SCI mode to enforce a "focused" experience.
2. **Selector Mismatch**: The CSS rule intended to hide the left panel in SCI mode uses the `~` (subsequent-sibling) combinator, but `.left-panel` appears before `#sidebar` in the DOM.

## Proposed Fix
Update `ui/styles.css` to use a more robust selector for `.left-panel` when in `.scientific-mode`.

```css
body.scientific-mode .left-panel {
    display: none !important; /* Or similar opacity/width reduction */
}
```

Wait, if the user wants "expanded in full", hiding the left panel makes sense. But the user also mentioned it's not expanding "in full". This implies the right panel is still constrained.

## Verification Plan
1. Apply CSS fix.
2. Verify SCI mode on desktop (1280px).
3. Confirm `.left-panel` is gone and SCI calculator takes up the space.
