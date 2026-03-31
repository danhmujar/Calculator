# Codebase Structure

**Analysis Date:** 2026-03-31

## Directory Layout

```
Calculator/
├── public/                 # Static assets (fonts, icons, sprites)
├── services/               # Core application logic and state management
├── tests/                  # Playwright test suites (e2e, unit, accessibility)
├── ui/                     # Presentation layer (styles, rendering, UI components)
├── .agent/                 # Agent-specific skills and metadata
├── .github/                # GitHub Actions workflows
├── .planning/              # GSD-specific implementation plans and codebase docs
├── index.html              # Main application entry point
├── package.json            # Dependencies and scripts
└── vite.config.js          # Build configuration and PWA plugin setup
```

## Directory Purposes

**services/:**
- Purpose: Contains the core business logic and state management.
- Contains: `app.js` (orchestrator), `store.js` (state container).
- Key files: `services/app.js`, `services/store.js`.

**ui/:**
- Purpose: Presentation layer and UI interaction.
- Contains: `styles.css`, `ui.js` (common components), `renderer.js` (display logic), `eye-tracker.js` (animations).
- Key files: `ui/styles.css`, `ui/renderer.js`.

**public/:**
- Purpose: Static assets served directly without processing by Vite.
- Contains: `fonts/`, `assets/sprites.svg`, PWA icons.
- Key files: `public/assets/sprites.svg`.

**tests/:**
- Purpose: Automated testing of the application.
- Contains: Playwright test files for accessibility, performance, and functionality.
- Key files: `tests/accessibility.spec.js`, `tests/integration.spec.js`.

## Key File Locations

**Entry Points:**
- `index.html`: Main HTML entry.
- `services/app.js`: Main JavaScript entry and orchestrator.

**Configuration:**
- `package.json`: Manifest of dependencies and build scripts.
- `vite.config.js`: Configuration for Vite and the PWA plugin.
- `.gitignore`: Standard exclusion patterns for git.

**Core Logic:**
- `services/app.js`: Implementation of calculation algorithms and mode switching.
- `services/store.js`: Implementation of the functional state store.

**Testing:**
- `tests/`: Directory for all automated tests.

## Naming Conventions

**Files:**
- JavaScript: `camelCase.js` (e.g., `eye-tracker.js`, `app.js`).
- Styles: `kebab-case.css` (e.g., `styles.css`).
- Tests: `[description].spec.js`.

**Directories:**
- Directories: `kebab-case` or simple names (e.g., `services`, `public`).

## Where to Add New Code

**New Calculation Feature:**
- Logic: Add to `services/app.js` or create a new service if complex.
- UI: Add HTML to `index.html` and styles to `ui/styles.css`.
- State: Add to `defaultState` in `services/store.js`.

**New UI Component:**
- Implementation: Create a new file in `ui/` (e.g., `ui/modal.js`).
- Styles: Add to `ui/styles.css`.
- Initialization: Import and call the initialization function in `services/app.js`.

**Utilities:**
- Shared helpers: `ui/renderer.js` for rendering or create a new file in `services/` or `ui/`.

## Special Directories

**.planning/:**
- Purpose: GSD-specific directory for implementation plans and codebase mapping documents.
- Generated: No (manual creation).
- Committed: Yes.

**node_modules/:**
- Purpose: External dependencies managed by npm.
- Generated: Yes.
- Committed: No.

**dist/:**
- Purpose: Compiled and bundled production build.
- Generated: Yes (by Vite).
- Committed: No.

---

*Structure analysis: 2026-03-31*
