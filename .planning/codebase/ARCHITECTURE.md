# Architecture

## Design Pattern

- **3-Tier Architecture (Client-Side)**:
  - **Presentation Layer (UI)**: Handled by `ui/ui.js` and `ui/styles.css`. Manages DOM updates, animations, modals, theming, and user interactions without touching direct mathematical evaluation.
  - **Business Logic Layer**: Handled by `services/app.js`. Processes the mathematical rules, calculator states, history/audit tape, and bridges UI with the logic.
  - **Data Access Layer**: Although there is no backend database, state persistence relies on browser `localStorage`. This is managed within `services/app.js`.

## Data Flow

- User interactions originate in `index.html` UI elements or keyboard inputs.
- Unobtrusive event listeners in the UI/Services layer capture inputs.
- Calculations are delegated to logical functions (`math.js` for complex expressions).
- Results are stored in the memory/state abstraction and persisted to `localStorage`.
- Event-driven updates refresh the DOM (e.g., updating the calculator display, history tape).

## Entry Points

- Application entry: `index.html`.
- Business Logic Initialization: `<script type="module" src="./services/app.js"></script>`
- UI Initialization: `<script type="module" src="./ui/ui.js"></script>`
