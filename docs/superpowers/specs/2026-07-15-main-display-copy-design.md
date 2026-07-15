# Main Display Copy Button — Design Spec

**Date:** 2026-07-15
**Status:** Approved
**Feature:** Copy button for the main calculator display

## Summary

Add a persistent copy icon button to the main calculator display area, positioned to the left of the result number. Clicking copies the raw numeric value (no commas, no `%`) to the clipboard with a toast notification.

## Requirements

- Copy button always visible in the calc-display area
- Positioned left of the result number, right-aligned
- Copies raw number (no formatting, no commas, no %)
- Shows "Copied to clipboard!" toast (same as existing copy buttons)
- Reuses existing `icon-btn` style and `createCopySvg()` pattern
- Static button in HTML, behavior wired in JavaScript

## DOM Structure

```html
<div
  class="calc-current"
  id="main-calc-display"
  aria-live="polite"
  tabindex="0"
>
  <button
    class="icon-btn display-copy-btn"
    id="display-copy-btn"
    aria-label="Copy result"
    title="Copy result"
  >
    <!-- SVG: sprites.svg#icon-copy, size 14 -->
  </button>
  <span class="display-value">0</span>
</div>
```

## Behavior

| Action         | Result                                                                             |
| -------------- | ---------------------------------------------------------------------------------- |
| Click button   | Read `#main-calc-display` text, strip commas and `%`, copy raw number to clipboard |
| After copy     | Show "Copied to clipboard!" toast via `showToast()`                                |
| Display update | `updateDisplay()` writes number into `.display-value`, button stays in place       |

## Implementation

### Files to modify

1. **`index.html`** — add button and `.display-value` span inside `.calc-current`
2. **`ui/styles.css`** — add `.display-copy-btn` positioning styles (absolute, left of result)
3. **`ui/uimanager.js`** — wire click handler, reuse `createCopySvg()` and existing copy logic

### No changes needed

- `store.js` — no state changes
- `app.js` — no logic changes
- `row-manager.js` — not involved

## Accessibility

- `aria-label="Copy result"` on the button
- `title="Copy result"` for tooltip
- Keyboard accessible (button is natively focusable)

## Testing

- Verify button appears in the calc-display area
- Verify click copies raw number (no commas) to clipboard
- Verify toast notification appears
- Verify button stays visible during display updates
- Verify keyboard accessibility (Tab to button, Enter/Space to copy)
- Verify button does not interfere with display text selection
