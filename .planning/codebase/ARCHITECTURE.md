# Architecture

**Analysis Date:** 2026-03-31

## Pattern Overview

**Overall:** 3-Tier Client-Side SPA (State, Service, View).

**Key Characteristics:**
- **Functional State Store**: Deep-copying and debounced persistence (localStorage).
- **Service Layer Orchestration**: Centralized `app.js` manages logic, PWA registration, and mode transitions.
- **Batched UI Rendering**: DOM updates are queued and executed via `requestAnimationFrame` using the `Renderer` utility.

## Layers

**State (Model) Layer:**
- Purpose: Manages the global application state and persistence.
- Location: `services/store.js`
- Contains: `Store` class, `defaultState`, and localStorage persistence logic.
- Depends on: None.
- Used by: `services/app.js`.

**Service (Logic) Layer:**
- Purpose: Orchestrates business logic (calculations, mode transitions, PWA features).
- Location: `services/app.js`
- Contains: Event handlers, calculation algorithms, PWA registration, and mode-switching logic.
- Depends on: `services/store.js`, `ui/renderer.js`, `ui/eye-tracker.js`, `mathjs`, `mathlive`.
- Used by: `index.html`.

**UI (View) Layer:**
- Purpose: Defines the layout, styling, and independent UI components.
- Location: `ui/`, `index.html`, `public/`
- Contains: Layout (HTML), Styling (CSS), Independent UI components (About modal, Eye tracker, Resizer), and batched rendering utility.
- Depends on: `services/store.js` (via subscriptions in `app.js`), `ui/renderer.js`.
- Used by: User.

## Data Flow

**Calculation Flow:**

1. **User Input**: User clicks a digit on the keypad or interacts with a percentage card.
2. **Event Trigger**: Centralized event delegation in `services/app.js` captures the click.
3. **Logic Execution**: `app.js` processes the input (e.g., `calcDigit`).
4. **State Update**: `app.js` calls `store.setState()`.
5. **Notification**: `Store` notifies all subscribers.
6. **Batched Render**: `app.js`'s subscriber calls `updateDisplay()`, which schedules a render via `ui/renderer.js`.
7. **DOM Update**: `Renderer` executes the update in the next `requestAnimationFrame` cycle.

**State Management:**
- Handled by `services/store.js`. Uses a functional approach (similar to Redux) but simplified for a vanilla JS app.
- Auto-persists to `localStorage` with a 500ms debounce to prevent performance degradation.

## Key Abstractions

**Store:**
- Purpose: Centralized, predictable state container.
- Examples: `services/store.js`
- Pattern: Observable Pattern.

**Renderer:**
- Purpose: Batching DOM updates to prevent layout thrashing and calculating dynamic font sizes.
- Examples: `ui/renderer.js`
- Pattern: Batching Pattern (using `requestAnimationFrame`).

**Chameleon Character (Eye Tracker):**
- Purpose: Interactive SVG animation that follows the mouse pointer.
- Examples: `ui/eye-tracker.js`
- Pattern: GPU-accelerated transforms via CSS variables.

## Entry Points

**HTML Entry Point:**
- Location: `index.html`
- Triggers: Browser page load.
- Responsibilities: Loads CSS, provides the DOM structure, and imports ES module scripts.

**Service Entry Point:**
- Location: `services/app.js`
- Triggers: Script load.
- Responsibilities: Initializes the application, registers the Service Worker, binds event listeners, and loads saved state.

## Error Handling

**Strategy:** Defensive programming and visual feedback.

**Patterns:**
- **Try/Catch Blocks**: Used in math evaluation (`mathjs`) and state loading.
- **Visual Feedback**: `showToast()` for errors like "Cannot divide by zero".
- **Safety Fallbacks**: MathLive fonts fall back to internal versions if local fetch fails.

## Cross-Cutting Concerns

**Logging:** Standard `console` methods for errors.
**Validation:** Regex-based input filtering for keypad and percentage inputs.
**Persistence:** Debounced `localStorage` synchronization.
**PWA Support:** `vite-plugin-pwa` handles Service Worker generation and update prompting.

---

*Architecture analysis: 2026-03-31*
