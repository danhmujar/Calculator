---
status: investigating
trigger: "Investigate and fix two regression bugs in the Calculator project:\n1. Missing Sidebar Rows: The left panel (history/favorites) is not displaying any card rows.\n2. Mode Switching Reset: When switching from Scientific (SCI) to Standard (STD) mode, the calculator value incorrectly resets to '0.0000e+0' instead of maintaining the current state or formatting correctly for standard mode.\n\nVerify the 'UIManager' and 'Store' interactions, specifically looking for state synchronization issues or event listener regressions introduced in Phase 06-04."
created: 2024-10-31T10:00:00Z
updated: 2024-10-31T10:00:00Z
---

## Current Focus

hypothesis: Regression in state synchronization or event listeners introduced in Phase 06-04.
test: Check UIManager and Store interactions for state updates and event handling.
expecting: Identify why sidebar rows are missing and why mode switching resets the value incorrectly.
next_action: Check knowledge base and then examine UIManager and Store code.

## Symptoms

expected: 
- Sidebar displays history/favorites card rows.
- Switching from SCI to STD maintains current state and formats value correctly.
actual: 
- Sidebar is empty (no card rows).
- Switching from SCI to STD resets value to '0.0000e+0'.
errors: []
reproduction: 
1. Open calculator.
2. Add items to history/favorites -> Sidebar remains empty.
3. Switch to SCI mode, perform calculation -> Value is formatted in scientific notation.
4. Switch to STD mode -> Value resets to '0.0000e+0' instead of standard format.
started: Phase 06-04

## Eliminated

## Evidence

- timestamp: 2024-10-31T10:30:00Z
  checked: services/store.js
  found: defaultState.persistent.cards was initialized as an empty object {}.
  implication: restorePercentageCards would do nothing on initial load if no state was saved, leading to empty cards if loadState returns true but cards is empty.

- timestamp: 2024-10-31T10:35:00Z
  checked: services/app.js and services/events.js
  found: onTriggerSave only called syncScientificRows. No method existed to sync percentage cards to the store.
  implication: Percentage card data was never saved to the store/localStorage.

- timestamp: 2024-10-31T10:40:00Z
  checked: ui/renderer.js
  found: fitDisplayText falls back to scientific notation (toExponential(4)) if requiredSizeRem < minRem.
  implication: If containerWidth is <= 0 (e.g., during layout transition), requiredSizeRem becomes <= 0, triggering the fallback even for small numbers like 0.

## Resolution

root_cause: 
1. Bug 1: Missing state synchronization for percentage cards and incomplete default state initialization.
2. Bug 2: Layout shift during mode switching caused zero-width measurement in fitDisplayText, triggering an premature scientific notation fallback.
fix: 
1. Initialized 'cards' in defaultState (store.js).
2. Added syncPercentageCards to AppOrchestrator and hooked it into onTriggerSave (app.js).
3. Updated restorePercentageCards to ensure all types are processed (uimanager.js).
4. Added containerWidth > 0 check to scientific notation fallback in fitDisplayText (renderer.js).
verification: 
1. Verify that percentage cards show at least one row on start and maintain data across reloads.
2. Verify that switching modes doesn't cause the display to show '0.0000e+0' temporarily or permanently.
files_changed: [services/store.js, services/app.js, ui/uimanager.js, ui/renderer.js]
