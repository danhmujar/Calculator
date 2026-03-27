# Accessibility Remaining Tasks (Option C)

Based on the current project state and memory logs, the following accessibility tasks are still pending to reach full WCAG compliance and best-practice ARIA support.

## 1. Color Contrast (WCAG AAA)
- **Target Elements:** Inactive mode toggle buttons (`#btn-mode-std`, `#btn-mode-sci`).
- **Issue:** Currently improved to WCAG AA (~4.9:1 ratio), but needs to reach **7:1 (WCAG AAA)** for better visibility.
- **Recommended Fix:** Change `--text-secondary` or the inactive button text color to a darker value (e.g., `#374151` in light mode).

## 2. Dynamic ARIA for Panel Resizer
- **Target Element:** `#panel-resizer` (Role: `separator`).
- **Issue:** The `aria-valuenow` attribute is static (`400`) and does not update when the sidebar is resized.
- **Recommended Fix:** Update the attribute in `ui/ui.js` inside the `pointermove` event handler to reflect the current `newWidth`.

## 3. Math Field Labels (Scientific Mode)
- **Target Elements:** Dynamically created `<math-field>` elements.
- **Issue:** Screen readers may not provide enough context for these fields.
- **Recommended Fix:** Set `aria-label="Mathematical expression"` when creating the element in `services/app.js`.

## 4. Card Input Accessibility
- **Target Elements:** Inputs inside `.calc-card` (Percentage cards).
- **Issue:** Inputs rely on placeholders for context, which is insufficient for some assistive technologies.
- **Recommended Fix:** Add descriptive `aria-label` attributes (e.g., "First value", "Second value") to the inputs in `ROW_TEMPLATES`.

## 5. Result ARIA Live Regions
- **Target Elements:** `.result-value` spans in percentage cards.
- **Issue:** Changes to calculation results are not automatically announced to screen readers.
- **Recommended Fix:** Add `aria-live="polite"` to the result value spans in the `createRow` function in `services/app.js`.

---
*Note: High-priority ARIA landmarks and basic keyboard navigation for the resizer have already been implemented.*
