# Codebase Concerns

**Analysis Date:** 2025-05-15

## Tech Debt

**Monolithic `services/app.js`:**
- Issue: The file has grown to nearly 1,200 lines and acts as a God Object, handling everything from PWA registration and state management to dynamic UI generation and event delegation.
- Files: `services/app.js`
- Impact: High cognitive load for maintainers; difficult to test in isolation; high risk of side effects when making changes.
- Fix approach: Refactor into smaller, focused modules (e.g., `CalculatorLogic`, `UIManager`, `PWAService`, `EventBinder`).

**Implicit and Inefficient State Proxy:**
- Issue: The `calcState` Proxy in `app.js` performs a deep clone of the entire store state on every property access (GET).
- Files: `services/app.js`, `services/store.js`
- Impact: Severe performance degradation as the state grows (e.g., many scientific rows or audit entries).
- Fix approach: Use a more efficient state access pattern; only clone when necessary or use immutable data structures with shallow clones.

**Direct DOM Manipulation:**
- Issue: Extensive use of `document.createElement`, `innerHTML`, and manual class/style toggling.
- Files: `services/app.js`, `ui/ui.js`, `ui/eye-tracker.js`
- Impact: The UI logic is tightly coupled with the DOM structure, making it fragile and difficult to refactor or unit test without a full JSDOM/browser environment.
- Fix approach: Transition to a lightweight reactive UI pattern or library, or at least use a template-based approach to separate HTML structure from logic.

## Known Bugs

**Scientific Mode Restoration on Mobile:**
- Issue: `restoreThemeAndMode` skips restoring scientific mode on mobile because the sidebar drawer starts closed.
- Files: `services/app.js`
- Trigger: Reloading the app on a mobile device while in scientific mode.
- Symptoms: The app reverts to standard mode, and scientific rows are not immediately visible/restored.

**Scientific Row Restoration Race Condition:**
- Issue: `restoreScientificRows` uses `setTimeout` with increasing delays (`index * 100ms`) to restore MathLive fields.
- Files: `services/app.js`
- Trigger: Restoring a state with many scientific rows.
- Symptoms: Rows may be restored in the wrong order or fail to initialize if the DOM isn't ready, leading to an inconsistent UI state.

## Security Considerations

**Usage of `innerHTML`:**
- Issue: `ROW_TEMPLATES` are injected into the DOM using `innerHTML`.
- Files: `services/app.js`
- Risk: Potential XSS vulnerability if these templates are ever modified to include user-provided data.
- Current mitigation: Templates are currently static constants.
- Recommendations: Replace `innerHTML` with `document.createElement` or use a sanitized template literal approach.

**Expression Evaluation:**
- Issue: `math.evaluate(expr)` is used to calculate scientific expressions.
- Files: `services/app.js`
- Risk: Although using `mathjs/number`, arbitrary expression evaluation always carries some risk of unexpected behavior or resource exhaustion.
- Current mitigation: `MATH_EXPR_LIMIT` (1000 chars) is used to prevent extremely long expressions.
- Recommendations: Ensure `mathjs` is configured with the most restrictive security settings possible.

## Performance Bottlenecks

**O(N) State Access:**
- Issue: `Store.getState()` uses `JSON.parse(JSON.stringify(this.state))`.
- Files: `services/store.js`
- Cause: Deep cloning the entire state on every read.
- Improvement path: Implement shallow cloning or return the state directly (with the risk of mutation) or use a library like `Immer`.

**Unbounded Cache Growth:**
- Issue: `textWidthCache` in `Renderer` is a `Map` that never clears.
- Files: `ui/renderer.js`
- Cause: Caching width measurements for every unique string displayed.
- Improvement path: Implement a Least Recently Used (LRU) cache or clear the cache when it reaches a certain size.

## Fragile Areas

**Scientific Row Initialization:**
- Files: `services/app.js`
- Why fragile: Relies on `MathfieldElement` being globally available, lazy-loaded imports, and complex `requestAnimationFrame` / `setTimeout` sequences.
- Safe modification: Ensure `mathlive` is fully loaded before attempting any scientific row operations; centralize the row creation logic.

**Event Delegation Rooted in IIFEs:**
- Files: `ui/ui.js`
- Why fragile: Logic is wrapped in IIFEs, making it inaccessible for external triggering or testing.
- Safe modification: Export initialization functions and state-check helpers instead of self-executing.

## Scaling Limits

**Store State Size:**
- Current capacity: Debounced `localStorage` saves (500ms).
- Limit: Performance of `JSON.stringify` on large objects.
- Scaling path: Segment state into "transient" (don't persist) and "persistent" parts.

**Audit Tape Length:**
- Current capacity: 100 entries (`MAX_AUDIT_ENTRIES`).
- Limit: Hardcoded limit to prevent DOM bloat.
- Scaling path: Implement virtualization for the audit tape list if more entries are needed.

## Test Coverage Gaps

**Performance and Stress Testing:**
- What's not tested: App behavior and responsiveness with 50+ scientific rows or a full 100-entry audit tape.
- Files: `tests/performance.spec.js`
- Risk: UI might become unresponsive or crash on lower-end devices.
- Priority: Medium

**Scientific Mode State Persistence:**
- What's not tested: Deep validation of complex expressions being correctly restored across sessions on both mobile and desktop.
- Files: `tests/state.spec.js`
- Risk: User loses complex work due to restoration failures.
- Priority: High

---

*Concerns audit: 2025-05-15*
