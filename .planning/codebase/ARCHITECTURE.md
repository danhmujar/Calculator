# Architecture

**Analysis Date:** 2025-05-13

## Pattern Overview

**Overall:** 3-Tier Client-Side Architecture (Presentation, Application, Data)

**Key Characteristics:**
- **Zero-Server Logic:** 100% client-side execution, ensuring privacy and offline capabilities.
- **Service-Driven Pattern:** Core business logic and state management are isolated in a "Services" layer (`services/app.js`).
- **Event-Driven Interaction:** DOM events trigger service methods which update internal state and then re-render specific UI parts.

## Layers

**Presentation Layer:**
- Purpose: Handles the visual representation, UI components, and layout.
- Location: `ui/` and `index.html`
- Contains: `ui/ui.js` (modals, resizers), `ui/styles.css`, `ui/fonts.css`, and the main structure in `index.html`.
- Depends on: `services/app.js` (for business logic triggers)
- Used by: End user

**Application/Service Layer:**
- Purpose: Orchestrates business logic, calculator operations, and cross-cutting concerns (PWA, themes, persistence).
- Location: `services/app.js`
- Contains: `calcState`, percentage calculation logic, event bindings, and PWA registration.
- Depends on: `localStorage` (for persistence), MathLive/Math.js (lazy-loaded via CDN).
- Used by: `index.html` (via module import), Presentation layer events.

**Data Tier (Persistence):**
- Purpose: Persistent storage of application state and user history across sessions.
- Location: Browser's `localStorage`
- Contains: JSON-serialized state including themes, audit history, and calculator values.
- Depends on: Browser APIs
- Used by: `services/app.js` (via `saveState` and `loadState` functions)

## Data Flow

**Calculation Flow:**

1. User clicks a button or types (DOM Event).
2. `services/app.js` event listeners capture the input.
3. Service logic updates `calcState` or calculates results (e.g., `calculateInternal`, `calculateRowResult`).
4. `updateDisplay()` or row-specific updaters refresh the DOM elements (`aria-live` regions).
5. State is debounced and persisted to `localStorage` via `saveState`.

**State Management:**
- **Ephemeral State:** Managed via `calcState` object and `auditEntries` array in `services/app.js`.
- **Persistent State:** JSON-serialized version of the above stored in `localStorage` under the key `interactiveCalcState`.

## Key Abstractions

**Row Templates:**
- Purpose: Encapsulates the structure and logic for different percentage calculation types.
- Examples: `ROW_TEMPLATES` in `services/app.js`.
- Pattern: Template literal-based rendering with programmatic binding.

**Scientific Mode Bridge:**
- Purpose: Manages the lazy loading and integration of complex external math libraries.
- Examples: `ensureSciLibs`, `activateScientificMode` in `services/app.js`.
- Pattern: Promise-based lazy loader with dynamic script injection.

## Entry Points

**Main Entry:**
- Location: `index.html`
- Triggers: Browser page load.
- Responsibilities: Loads initial HTML structure, critical CSS, and modules (`services/app.js`, `ui/ui.js`).

**PWA Service Worker:**
- Location: `public/sw.js`
- Triggers: Browser's service worker lifecycle events (install, activate, fetch).
- Responsibilities: Caching assets for offline use, handling background sync/pre-fetching.

## Error Handling

**Strategy:** Fail-soft with user notifications and defensive input validation.

**Patterns:**
- **User Notifications:** Toast messages via `showToast()` for invalid operations (e.g., divide by zero).
- **Input Validation:** Range and type checking in `calculateRowResult` and `calcDigit`.
- **Resilience:** `try/catch` blocks around state restoration (`loadState`) and scientific expression evaluation (`math.evaluate`).

## Cross-Cutting Concerns

**Logging:** Minimal console logging for critical failures (e.g., "Failed to load calc state").
**Validation:** `VALID_THEMES`, `VALID_CARD_TYPES`, and `INPUT_LENGTH_LIMIT` constants enforce application constraints.
**PWA/Offline:** Service Worker (`sw.js`) and manifest integration for installability and offline resilience.

---

*Architecture analysis: 2025-05-13*
