# Row Name Feature — Design Spec

**Date:** 2026-07-15
**Status:** Approved
**Feature:** User-preferred naming for scientific mode rows

## Summary

Add an inline-editable name field above each scientific mode row's math-field input. Users can click to name their rows for organization. Names are session-only (not persisted to localStorage).

## Requirements

- Name appears above the math-field as a row header
- Inline editable: click to edit, click away or Enter to save
- Empty by default with placeholder text "Name this row..."
- Max length: 30 characters
- Session only: names do not persist across page reloads
- Escape cancels edit and reverts to previous name

## DOM Structure

```html
<div class="math-row">
  <div class="row-name-wrapper">
    <span
      class="row-name-display"
      role="button"
      tabindex="0"
      aria-label="Edit row name"
    >
      Row name
    </span>
    <input
      type="text"
      class="row-name-input"
      maxlength="30"
      placeholder="Name this row..."
      aria-label="Row name"
      hidden
    />
  </div>
  <math-field>...</math-field>
  <div class="math-actions">
    <span class="math-result">= ...</span>
    <button class="icon-btn">copy</button>
    <button class="icon-btn delete-row-btn">delete</button>
  </div>
</div>
```

## Behavior

| Action                     | Result                                                                    |
| -------------------------- | ------------------------------------------------------------------------- |
| Click span / Enter on span | Hide span, show input, auto-focus, pre-fill current name                  |
| Blur or Enter on input     | Save value, hide input, show span with new text (or placeholder if empty) |
| Escape on input            | Cancel edit, revert to previous name                                      |
| Empty on save              | Revert to placeholder "Name this row..."                                  |
| Max length                 | Enforced by `maxlength="30"` attribute                                    |

## Implementation

### Files to modify

1. **`ui/row-manager.js`** — modify `createRow()` or `addScientificRow()` to build the name wrapper
2. **`ui/styles.css`** — add styles for `.row-name-wrapper`, `.row-name-display`, `.row-name-input`

### No changes needed

- `store.js` — no state persistence for names
- `app.js` — no state sync needed
- `uimanager.js` — no changes (row-manager handles it)

## Accessibility

- `role="button"` and `tabindex="0"` on the display span for keyboard access
- `aria-label="Edit row name"` on both span and input
- Enter/Escape keyboard support in the input

## Testing

- Verify name appears above math-field in each new row
- Verify click-to-edit flow works (span → input → span)
- Verify Enter saves, Escape cancels
- Verify empty name reverts to placeholder
- Verify max length enforcement (30 chars)
- Verify names do not persist after page reload
- Verify accessibility (keyboard navigation, screen reader labels)
