# Phase 1 Context: Performance-First Core

## Decisions & Constraints

### 1. State Management
- **Pattern:** `class Store` with PubSub.
- **Mechanism:** `setState(updates)` merges changes and notifies subscribers.
- **Persistence:** Debounced `localStorage.setItem` (500ms).
- **Rationale:** Provides a single source of truth without the overhead of Proxies or complex state libraries, fulfilling [REQ-P2].

### 2. UI Rendering
- **Pattern:** `requestAnimationFrame` batching.
- **Mechanism:** All DOM writes (display text, result updates, eye-tracking) must be queued and executed in a single rAF callback.
- **Rationale:** Ensures one DOM write per frame, fulfilling [REQ-P3].

### 3. Font Fitting (`fitDisplayText`)
- **Mechanism:** Use `CanvasRenderingContext2D.measureText()` for text width calculation.
- **Optimization:** Implement a `Map`-based cache for measured string widths.
- **Rationale:** Eliminates layout-thrashing loops (synchronous read-write of `scrollWidth` and `fontSize`), fulfilling [REQ-P1].

### 4. Architecture & Modules
- **Format:** ES Modules (standard for Vite).
- **File Structure:**
    - `services/store.js`: Manages application state.
    - `ui/renderer.js`: Handles all DOM manipulation.
    - `services/app.js`: Coordinates events, business logic, and ties the store to the renderer.
- **Rationale:** Strictly enforces 3-tier architecture, fulfilling [REQ-M1].

### 5. Eye-Tracking ([REQ-P4])
- **Mechanism:** Update CSS variables (`--pupil-x`, `--pupil-y`) instead of direct element styles (`left`, `top`).
- **Rationale:** Offloads layout calculations to the browser's compositor thread, improving frame rates.

## Success Criteria (Technical)
- [ ] No more than 1 layout-inducing read/write cycle per frame during input.
- [ ] State is centralized and can be exported/imported as a single JSON object.
- [ ] `fitDisplayText` executes in < 1ms even for long expressions.
